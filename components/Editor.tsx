import Document from "@tiptap/extension-document";
import Paragraph from "@tiptap/extension-paragraph";
import Text from "@tiptap/extension-text";
import Mention from "@tiptap/extension-mention";
import { useEditor, EditorContent, Extension } from "@tiptap/react";
import { useRef, useEffect, useState } from "react";
import tippy from 'tippy.js';
import { ReactRenderer } from '@tiptap/react';
import { ContextList, type ContextSuggestionRef, type Context } from './ContextSuggestions';


export default function Editor({content, setContent, onSubmit, handleAddFile, editorContainerRef, multipleLines, openToolsDrawer, selectedContexts, setSelectedContexts, onEditorReady}: {
    content: string, 
    setContent: (content: string) => void, 
    onSubmit: (content: string) => void, 
    handleAddFile: (file: File) => void, 
    editorContainerRef: React.RefObject<HTMLDivElement>,
    multipleLines: boolean,
    openToolsDrawer: boolean,
    selectedContexts: Context[],
    setSelectedContexts: (contexts: Context[]) => void,
    onEditorReady?: (editor: any) => void
}) {
    
    const onSubmitRef = useRef(onSubmit);
    const selectedContextsRef = useRef(selectedContexts);
    const setSelectedContextsRef = useRef(setSelectedContexts);
    const [fetchedTabs, setFetchedTabs] = useState<Context[]>([]);
    const fetchedTabsRef = useRef<Context[]>([]);
    
    // Fetch all tabs from browser on component mount and set up persistent listener
    useEffect(() => {

        // Set up persistent listener
        window.electronAPI.on("getAllTabs", (event: any, data: any) => {
            console.log('[Editor] Received tabs response:', data)
            
            if (data.status === "OK") {
                console.log('[Editor] Tabs fetched successfully:', data.tabs)
                const tabs = data.tabs || []
                setFetchedTabs(tabs)
                fetchedTabsRef.current = tabs
            } else {
                console.error('[Editor] Error fetching tabs:', data.error)
                setFetchedTabs([])
                fetchedTabsRef.current = []
            }
        })
        
        // Initial fetch
        console.log('[Editor] Initial tab fetch...')
        window.electronAPI.send("getAllTabs")

        // Cleanup listener on unmount
        return () => {
            window.electronAPI.removeAllListeners("getAllTabs")
        }
    }, [])
    
    useEffect(() => {
        onSubmitRef.current = onSubmit;
        selectedContextsRef.current = selectedContexts;
        setSelectedContextsRef.current = setSelectedContexts;
        fetchedTabsRef.current = fetchedTabs;
    }, [onSubmit, selectedContexts, setSelectedContexts, fetchedTabs]);

    const editor = useEditor({
        editorProps: {
            attributes: {class: "outline-none", id: "prompt-input-editor"}
        },
        extensions: [Document, Paragraph, Text, Extension.create({
            addKeyboardShortcuts() {
            return {
                Enter: () => {
                    onSubmitRef.current(this.editor.getText());
                    return this.editor.commands.clearContent();
                },

                'Shift-Enter': () => {
                    /**
                     * currently we do not have an option to show a soft line break in the posts, so we overwrite
                     * the behavior from tiptap with the default behavior on pressing enter
                     */
                    return this.editor.commands.first(({commands}) => [
                        () => commands.newlineInCode(),
                        () => commands.createParagraphNear(),
                        () => commands.liftEmptyBlock(),
                        () => commands.splitBlock(),
                    ]);
                },
            };
        },
        }), 
        Mention.configure({
            suggestion: {
                char: '@',
                items: ({ query }) => {
                    // Fetch fresh tabs every time the menu is invoked
                    if (query == ""){
                        console.log('[Editor] Menu invoked, fetching fresh tabs...')
                        window.electronAPI.send("getAllTabs")
                    }
                    // Use current fetched tabs for immediate display
                    const allContexts = fetchedTabsRef.current
                    console.log('[Editor] All contexts for filtering:', allContexts.length, 'fetched tabs');
                    
                    return allContexts
                        .filter(context => 
                            !selectedContextsRef.current.some(selected => selected.id === context.id) && // Don't show already selected contexts
                            (context.name.toLowerCase().includes(query.toLowerCase()) || context.url.includes(query.toLowerCase()))
                        )
                },
                render: () => {
                    let component: ReactRenderer<ContextSuggestionRef>
                    let popup: any
                    return {
                        onStart: (props: any) => {
                            component = new ReactRenderer(ContextList, {
                                props,
                                editor: props.editor,
                            })
                            if (!props.clientRect) {
                                return
                            }
                            popup = tippy('body', {
                                getReferenceClientRect: props.clientRect,
                                appendTo: () => document.body,
                                content: component.element,
                                showOnCreate: true,
                                interactive: true,
                                trigger: 'manual',
                                placement: 'bottom-start',
                                zIndex: 9999,
                            })
                        },

                        onUpdate(props: any) {
                            component.updateProps(props)
                            if (!props.clientRect) {
                                return
                            }
                            popup[0].setProps({
                                getReferenceClientRect: props.clientRect,
                            })
                        },

                        onKeyDown(props: any) {
                            if (props.event.key === 'Escape') {
                                popup[0].hide()
                                return true
                            }
                            return component.ref?.onKeyDown(props) || false
                        },

                        onExit() {
                            popup[0].destroy()
                            component.destroy()
                        },
                    }
                },
                command: ({ editor, range, props }) => {
                    // Add the whole context object to selected contexts
                    const contextToAdd = props as Context;
                    if (contextToAdd.id) {
                        const newContexts = [...selectedContextsRef.current, contextToAdd];
                        setSelectedContextsRef.current(newContexts);
                    }
                    
                    // Just remove the @ character without inserting anything
                    editor
                        .chain()
                        .focus()
                        .deleteRange(range)
                        .run()
                },
            },
        })],
        // set the initial content
        content: content,
        onUpdate: ({ editor }) => {
            // update the content state whenever the editor content changes
            setContent(editor.getText());
        },

        onPaste: (e) => {
            const data = e.clipboardData;
            if (data){
                if (data.files && data.files.length > 0) {
                    e.preventDefault();
                    const file = data.files[0];
                    if (file.type == 'image/png' || file.type == 'image/jpeg') {
                        handleAddFile(file);
                    }
                }
            }
        },


        immediatelyRender: false,
        autofocus: true,
    });

    // Set cursor to end when editor is first created and whenever content prop changes
    useEffect(() => {
        if (editor && onEditorReady){
            onEditorReady(editor);
        }
    }, [editor, onEditorReady]);

    return (
        <div ref={editorContainerRef} className={`editor-container w-full max-h-[72px] overflow-auto h-max ${multipleLines ? "pl-2 mb-2 w-full" : ""}`}>
            <EditorContent editor={editor} className={`outline-none border-none placeholder:text-foreground/50 w-full ${openToolsDrawer && 'opacity-0'}`} />
        </div>
    );
}
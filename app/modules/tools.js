import {getInstalledApps} from 'get-installed-apps'


async function openApp(args) {
    const appName = args.appName;

    const apps = await getInstalledApps()
    console.log(apps.find((app)=> app.DisplayName.includes("Discord")))

    console.log('Opening app:', appName);
    return `Opening ${appName}..`
}


export const availableToolFunctions = {
    openApp: openApp,
};


export const toolsList = [
    {
        type: 'function',
        function: {
            name: 'openApp',
            description: 'Open an application on the user\'s computer, based on their explicit request.',
            parameters: {
                type: 'object',
                properties: {
                    appName: {
                        type: 'string',
                        description: 'The name of the application to open.',
                    },
                },
                required: ['appName'],
            },
        },
    },
    
];

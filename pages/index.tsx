import { useRouter } from "next/router"

export default function Home() {
  const router = useRouter()
  if (router.query.route === "writingTools") {
    router.push("/writingTools")
  } else if (router.query.route === "prompt") {
    router.push("/prompt")
  } else if (router.query.route === "setup") {
    router.push("/setup")
  } else if (router.query.route === "updater") {
    router.push("/updater")
  } else if (router.query.route === "settings") {
    router.push("/settings")
  }
  return <></>
}

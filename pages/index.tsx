import { useRouter } from "next/router"

export default function Home() {
  const router = useRouter()
  if (router.query.route === "writingTools") {
    router.push("/writingTools")
  } else if (router.query.route === "prompt") {
    router.push("/prompt")
  }
  return <></>
}

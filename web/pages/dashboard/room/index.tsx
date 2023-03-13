import { Nav } from "@/components/Nav/Nav";
import { AuthContext } from "@/contexts/AuthContext";
import { useRouter } from "next/router";
import { useContext } from "react";
import { dashboardNavs } from "../navs";

export function RoomIndex() {
  const auth = useContext(AuthContext)
  const user = auth.getUser()
  const router = useRouter()
  const lang = router.locale!

  return (
    <>
      <Nav navs={dashboardNavs} user={{name: user?.username!, role: user?.role!}}/>
    </>
  )
}

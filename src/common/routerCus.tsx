import { getDefaultStore } from "jotai";
import { useNavigate } from "react-router-dom";
import { tokenState } from "./store/store";

function router(page:string) {
  const navigate=useNavigate()
  const store=getDefaultStore()
  const token=store.get(tokenState)
  if(token==""){
    navigate("/login?next="+page,{replace:true})
  }else{
    navigate(page)
  }
}

export default {
  router,
}
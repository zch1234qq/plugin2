import { useEffect } from "react";
import { tokenState } from "../common/store/store";
import { useAtomValue } from "jotai";
import { useCustomNavigate } from "../common/hooks/useCustomNavigate";
import { Flex, Spin } from "antd";

type Props={
  next?:string
  children:React.ReactNode
}
export default function ComAuthCheck({next,children}:Props) {
  const token=useAtomValue(tokenState)
  const navigate=useCustomNavigate()

  useEffect(()=>{
    if(next=="/"){
      navigate("/")
      return
    }
    if(!token){
      if(next){
        navigate(`/login?next=${next}`,{
          replace:true,
          state:{
            from:next
          }
        })
      }else{
        navigate("/login", { replace: true })
      }
    }
  },[token,navigate,next])

  return(
    <Flex style={{width:"100%",height:"100%"}} justify="center" align="center">
      {token?children:<Spin/>}
    </Flex>
  )
}

import { useMemo, useState } from "react";
import { TypeNotice } from "../common/types/types";
import { Alert } from "antd";
import { useAtom } from "jotai";
import { stateRecordNotice } from "../common/store/store";  
export default function ComNotice(){
  const [stateNotice,setStateNotice] = useAtom(stateRecordNotice)
  const [notices,_] = useState<TypeNotice[]>([
    {
      id:"bxl0802",
      message:<>无限版会员，资源点随意用，<span style={{color:"#ff4d4f",fontWeight:"bold"}}>98元/月</span>，详情咨询客服</>,
      type:"info",
      show:true
    }
  ])

  const Notices=useMemo(()=>{
    let id:string="bxl0802"
    let notice=notices.find((notice)=>notice?.id===id)
    if (stateNotice && notice?.id) {
    }
    return notices.filter((notice)=> {
      if (!stateNotice) return true;
      return (stateNotice[notice?.id||""] || stateNotice[notice?.id||""]===true);
    });
  },[notices,stateNotice])

  return (
    <div>
      {
        Notices.map((notice)=>(
          <Alert 
            key={notice.id}
            closeIcon
            message={notice.message} 
            type={notice.type as "info" | "success" | "warning" | "error"} 
            closable 
            onClose={()=>{
              notices.filter((notice)=>{
                if(stateNotice){
                  if(!stateNotice[notice.id]){
                    return true
                  }else if(stateNotice[notice.id]===true){
                    return true
                  }
                }
                return (!stateNotice||!stateNotice[notice.id]
                ||stateNotice[notice.id]===true)&&(!notice.endtime||notice.endtime<Date.now())
              })
              setStateNotice({...stateNotice, [notice.id]: false})
            }}
          />
        ))
      }
    </div>
  )
}
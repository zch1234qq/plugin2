import { useCustomNavigate } from "../common/hooks/useCustomNavigate"
import { EnumProtocls, RecordProtocolPages } from "../common/types/types"

type Argv={
  title:EnumProtocls,
}

export function ComProtocol({title}:Argv){
  const navigate=useCustomNavigate()
  return(
    <div style={{userSelect:"none",cursor:"pointer",color:"blue"}} onClick={()=>{
      // navigate(RecordProtocolPages[title])
      // window.open("https://aditor.cn"+RecordProtocolPages[title],"_blank")
      navigate(RecordProtocolPages[title])
    }}>{title}</div>
  )
}
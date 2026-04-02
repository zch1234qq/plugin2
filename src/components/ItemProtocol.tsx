type Item={
  name:string,
  contents:string[]
}
type Argv={
  items:Item[]
}
export function ItemProtocol({items}:Argv) {
  if(items.length>0){
    return(
      <div>
        {
          items.map((item,index)=>{
            return <div key={index}>
              <h3 style={{fontWeight:600}} key={index}>{index+1}.{item.name}
              </h3>
              {
                item.contents.map((content,i)=>{
                  return <div key={i}>
                    {content}
                  </div>
                })
              }
            </div> 
          })
        }
      </div>
    )
  }else{
    return(
      <div></div>
    )
  }
}
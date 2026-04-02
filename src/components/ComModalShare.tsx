import { Button, Card, Divider, Flex, Modal, Spin } from "antd";
import { useEffect } from "react";
import { useState } from "react";
import server from "../common/service/server";
import { useAtom } from "jotai";
import { stateCreated, statePlugins } from "../common/store/store";
import * as Icon from "@ant-design/icons"

import { Packaging } from "../common/classes";
import ComModalCloneOverwrite from "./ComModalCloneOverwrite";
import utils from "../common/utils";
import { useCustomNavigate } from "../common/hooks/useCustomNavigate";

export default function ComModalShare({shareId}:{shareId:string}){
  const [modalShare,setModalShare]=useState(false)
  const [packaging,setPackaging]=useState<Packaging|null>(null)
  const [created,setCreated]=useAtom(stateCreated)
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [plugins,setPlugins]=useAtom(statePlugins)
  const [loading,setLoading]=useState(false)
  const navigate=useCustomNavigate()
  
  useEffect(()=>{
    if(shareId){
      server.shareVisit(shareId)
      .then(res=>{
        let data=res.data
        if(data.success){
          let plugjson=data.plugjson
          let plugShared:Packaging=JSON.parse(plugjson) as Packaging
          plugShared.isRef=true
          setPackaging(plugShared)
          setPlugins({...plugins,
            [Packaging.GetIdStrStatic(plugShared)]:plugShared
          })
          setModalShare(true)
        }
      })
      .catch((error) => {
        // 检查是否是circuit breaker错误
        if (error instanceof Error && error.message && error.message.includes('circuit breaker')) {
          window.messageApi.error({
            content: '服务器繁忙，请稍后重试',
            key: 'shareError'
          });
        } else {
          window.messageApi.error({
            content: '分享访问失败',
            key: 'shareError'
          });
        }
      });
    }
  },[shareId])

  const handleCloneToExisting = async (pluginCreated: Packaging, currentShareId: string) => {
    setIsModalVisible(false);
    setModalShare(false);
    let temp = plugins[currentShareId];
    if(!temp){
      setLoading(true);
      await server.shareVisit(currentShareId)
      .then(res=>{
        let data=res.data;
        if(data.success){
          let plugjson=data.plugjson;
          let plugShared:Packaging=JSON.parse(plugjson) as Packaging;
          plugShared.isRef=true;
          setPackaging(plugShared);
          temp=plugShared;
        }
      });
    }
    if(temp){
      var id=Packaging.GetIdStrStatic(pluginCreated);
      pluginCreated = { ...temp, name: temp.name, id: pluginCreated.id, uuid: pluginCreated.uuid, load: pluginCreated.load };
      server.save(pluginCreated);
      setCreated({...created,
        [id]:pluginCreated  
      });
    }
    setTimeout(()=>{
      // router(`/editor?type=edit&id=${id}`);
      window.messageApi.success({
        content: '克隆成功',
        key: 'cloneSuccess'
      });
      //使用navigate跳转replace至无分享页面,来避免刷新重新弹窗
      navigate(`/table`,{replace:true})
      setLoading(false);
    },50);
  };

  const handleClone = () => {
    utils.log("handleClone");
    // 检查是否有足够的应用数量配额
    let length = Object.keys(created).length;
    //
    server.create("应用"+(length+1))
    .then(res => {
      let data = res.data;
      if(data.success&&packaging){
        setLoading(true);
        let pluginCreated = data.plugin;
        // packaging.id=plugin.id
        handleCloneToExisting(pluginCreated, shareId);
        setModalShare(false);
      } else {
        setIsModalVisible(true);
      }
    })
    .catch((error) => {
      // 检查是否是circuit breaker错误
      if (error instanceof Error && error.message && error.message.includes('circuit breaker')) {
        window.messageApi.error({
          content: '服务器繁忙，请稍后重试',
          key: 'cloneError'
        });
      } else {
        window.messageApi.error({
          content: '克隆失败',
          key: 'cloneError'
        });
      }
    });
  }

  if(loading){
    return(
      <Flex justify="center" align="center" style={{width:"100%",height:"100%",position:"absolute"}}>
        <Spin indicator={<Icon.LoadingOutlined style={{ fontSize: 24 }} spin />} />
      </Flex>
    )
  }
  return(
    <>
      <Modal open={modalShare} onCancel={()=>setModalShare(false)}
        title="获得分享" footer={null} style={{borderRadius:12,maxWidth:"80%"}}
      >
        <Flex vertical gap="small"> 
          <Card>
            <Flex vertical style={{width:"100%",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div>{packaging?.name}</div>
              <Divider />
              <div>{packaging?.description}</div>
            </Flex>
          </Card>
          <Flex justify="center" align="center" gap="small">
            <Button type="primary" icon={<Icon.CopyFilled style={{color:"white"}} />} onClick={handleClone} style={{width:"50%"}}>一键克隆</Button>
            {/* <Button type="primary" icon={<Icon.PlayCircleFilled />} onClick={handleRun} style={{width:"50%"}}>运行</Button> */}
          </Flex>
        </Flex>
      </Modal>
      
      <ComModalCloneOverwrite
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onClone={(targetId:string)=>{
          let target=created[targetId];
          if(target){
            handleCloneToExisting(target, shareId);
          }
        }}
        appOptions={Object.values(created)}
        loading={loading}
      />
    </>
  )
}
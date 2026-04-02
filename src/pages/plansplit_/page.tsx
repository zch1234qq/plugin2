import { Dispatch, SetStateAction, useCallback, useEffect, useMemo, useState } from "react";
import LoadingCus from "../../components/loadingCus";
import { TypePlan } from "../../common/types/types";
import { Button, Card, Drawer, Flex, Radio, Spin, Typography, theme as antTheme } from "antd";
import './style.css'
import server from "../../common/service/server";
import { useAtom, useAtomValue } from "jotai";
import { isMobileState, stateUserInfo, tokenState } from "../../common/store/store";
import * as Icon from '@ant-design/icons'
import IconAlipay from '../../assets/alipay.png'
import utils, { handleRefreshToken } from "../../common/utils";
import { useCustomNavigate } from "../../common/hooks/useCustomNavigate";
import ComBack from "../../components/ComBack";
import config from "../../common/config/config";
import ComCusSvc from "../../components/ComCusSvc";
import ComConsumeRulesLink from "../../components/ComConsumeRulesLink";

export default function Page({callBack}:{callBack?:()=>void}){
  const { token } = antTheme.useToken();

  return(
    <>
      <ComCusSvc />
      <div style={{
        minHeight: '100vh',
        padding: '20px 0',
        background: token.colorBgLayout,
      }}>
        <_Page callBack={callBack} />
      </div>
    </>
  )
}

type TypePlanItem={
  name:string,
  unit:string,
  counts:number[]
}

// 无限包资源包价格常量
const UNLIMITED_PLAN_PRICE = 99;

function _Page({callBack}:{callBack?:()=>void}) {
  const { token: antdToken } = antTheme.useToken();
  const [loading,setLoading]=useState(false)
  const [plans,setPlans]=useState<TypePlan[]>([])
  const [selectedId,setSelectedId]=useState<number>(0)
  const [isMobile,]=useAtom(isMobileState)
  const [open,setOpen]=useState(false)
  const [planItems,setPlanItems]=useState<TypePlanItem[]>([])
  const [discount,setDiscount]=useState<number>(100)
  const [priceFinal,setPriceFinal]=useState<number>(0)
  const token=useAtomValue(tokenState)
  const navigate=useCustomNavigate()

  let planItemsBase:TypePlanItem[]=[
    {
      name:config.tokenName,
      unit:"",
      counts:[0,0,0,0,0] // 支持5个资源包（包含无限包）
    },
    {
      name:"技术支持",
      unit:"次",
      counts:[0,0,0,0,0] // 支持5个资源包（包含无限包）
    }
  ]

  const planSelected=useMemo(()=>{
    if(plans.length==0){
      return null
    }else{
      return plans[selectedId]
    }
  },[selectedId,plans])

  const closeDrawer=()=>{
    setOpen(false)
  }

  useEffect(()=>{
    setLoading(true)
    server.pullPlanConfig()
    .then(res=>{
      utils.log(res)
      var data=res.data
      // 支持5个资源包（包含无限包）
      for(let i = 0; i < Math.min(4, data.plans.length); i++) {
        planItemsBase[0].counts[i] = data.plans[i]?.counttoken || 0
        planItemsBase[1].counts[i] = data.plans[i]?.countsupport || 0
      }
      
      // 总是添加无限包作为第5个选项
      let allPlans = [...data.plans.slice(0, 4)] // 只取前4个
      // 设置无限包的计数
      planItemsBase[0].counts[4] = -1
      planItemsBase[1].counts[4] = -1
      setPlanItems([...planItemsBase])
      
      setPlans(allPlans) // 设置所有5个资源包
      setDiscount(data.ratio)
    })
    .catch(error=>{
      utils.log(error)
    })
    .finally(()=>{
      setLoading(false)
    })
  },[])

  useEffect(()=>{
    if (planSelected?.price && discount) {
      const calculatedPrice = planSelected.price * discount / 100;
      setPriceFinal(isNaN(calculatedPrice) ? 0 : calculatedPrice);
    } else {
      setPriceFinal(0);
    }
  },[planSelected,discount])
  
  return(
    <div className="plan-container" style={{overflowY:"auto",height:"100dvh", maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      <LoadingCus isLoading={loading} transparent>
        <ComBack />
        <Drawer height={"100dvh"} open={open} placement="bottom" onClose={closeDrawer}>
          {
            !isMobile&&
            <PayInPc plan={planSelected!} finalPrice={priceFinal} callBack={()=>{closeDrawer();callBack?.()}}></PayInPc>
          }
          {
            isMobile&&
            <PayInPhone plan={planSelected!} finalPrice={priceFinal} callBack={()=>{closeDrawer();callBack?.()}}></PayInPhone>
          }
        </Drawer>

        {/* 资源包使用说明 */}
        <div className="plan-description">
          <div style={{ color: antdToken.colorTextSecondary, lineHeight: '1.6' }}>
            <Typography.Text strong style={{ color: antdToken.colorPrimary }}>
              购买说明：
            </Typography.Text>
            <Typography.Paragraph style={{ margin: '6px 0' }}>
              1、处理1张图片最低仅消耗0.8资源点。
            </Typography.Paragraph>
            <Typography.Paragraph style={{ margin: '0 0 6px' }}>
              2、处理1次文本最低仅消耗0.1资源点（1资源点最多可以处理约1000字）。
            </Typography.Paragraph>
            <Typography.Paragraph style={{ margin: '0 0 6px' }}>
              3、仅浅蓝色的节点消耗资源点，其余任何节点均不消耗资源点。
            </Typography.Paragraph>
            <Typography.Paragraph style={{ margin: 0 }}>
              4、购买的资源点不会失效。
            </Typography.Paragraph>
            {/* <div style={{color: 'red', fontSize: '14px'}}>
              注意：如果调用了多个AI节点，或者图片尺寸很大的话，将会消耗大量资源点。
            </div> */}
            <ComConsumeRulesLink/>
          </div>
        </div>
        {/* 套餐条形布局 - 4个矮条 */}
        <div className="plan-strip-container" style={{
          maxWidth: '600px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          width: '100%',
          // 移除滚动设置，避免与父容器冲突
          paddingBottom: '100px' // 为底部固定按钮留出空间
        }}>
          {
            plans.map((plan,index)=>{
              return(
                <InfoPlan 
                  key={index} 
                  plan={plan} 
                  planItems={planItems} 
                  indexSelected={index} 
                  discount={discount}
                  selectedId={selectedId}
                  setSelectedId={setSelectedId}
                />
              )
            })
          }
        </div>
        
        {/* 底部固定开通按钮 */}
        <div className="fixed-button-container" style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: antdToken.colorBgContainer,
          borderTop: `1px solid ${antdToken.colorBorderSecondary}`,
          padding: '16px 20px',
          zIndex: 1000,
          boxShadow: antdToken.boxShadowSecondary
        }}>
          {false? (
            <Button 
              type="primary"
              size="large"
              block
              style={{
                height: '50px',
                fontWeight: 'bold',
                backgroundColor: '#722ed1',
                borderColor: '#722ed1'
              }}
              onClick={()=>{
                // 这里可以添加联系客服的逻辑，比如打开客服聊天窗口
                window.open(config.customerService0, '_blank')
              }}
            >
              联系客服开通
            </Button>
          ) : (
            <Button 
              type="primary"
              size="large"
              block
              style={{
                height: '50px',
                fontWeight: 'bold'
              }}
              onClick={()=>{
                if(token){
                  setOpen(true)
                }else{
                  navigate("/login?next=/plan")
                }
              }}
            >
              付款
            </Button>
          )}
        </div>
      </LoadingCus>
    </div>
  )
}

function AfterPay({mode,plan,callBack}:{mode:number,plan:TypePlan,callBack?:()=>void}) {
  const { token: antdToken } = antTheme.useToken();
  const [userInfo,setUserInfo]=useAtom(stateUserInfo)
  const [show,setShow]=useState(false)
  const [paymentHtml, setPaymentHtml] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const navigate=useCustomNavigate()
  
  useEffect(()=>{
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
    }, 5000)

    server.orderCreate(mode,plan)
    .then(res=>{
      var data=res.data
      utils.log(data);
      setPaymentHtml(data);
      setShow(true)
    })
    .catch(error=>{
      utils.log(error);
    })
  },[])
  
  // 处理iframe加载完成后的表单提交
  const handleIframeLoad = (iframe: HTMLIFrameElement | null) => {
    if (iframe && iframe.contentDocument && paymentHtml) {
      try {
        // 直接写入原始HTML，因为表单提交后会跳转到支付宝页面
        iframe.contentDocument.open();
        iframe.contentDocument.write(paymentHtml);
        iframe.contentDocument.close();
        
        // 添加CSS确保iframe内部内容水平居中
        const style = iframe.contentDocument.createElement('style');
        style.textContent = `
          body {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            margin: 0;
            padding: 0;
          }
          * {
            margin-left: auto !important;
            margin-right: auto !important;
          }
        `;
        iframe.contentDocument.head.appendChild(style);
        
        // 监听iframe的加载事件，直接提交原页面
        iframe.onload = () => {
          try {
            const iframeDoc = iframe.contentDocument;
            if (iframeDoc) {
              // 自动提交表单
              const forms = iframeDoc.querySelectorAll('form');
              forms.forEach(form => {
                form.submit();
              });
            }
          } catch (error) {
            console.error('处理iframe内容失败:', error);
          }
        };
      } catch (error) {
        console.error('iframe加载失败:', error);
      }
    }
  }
  
  // 监听来自iframe的消息
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // 验证消息来源和类型
      if (event.data && event.data.type === 'payment_status') {
        utils.log('收到支付状态消息:', event.data);
        if (event.data.status === 'completed' || event.data.status === 'success') {
          // 支付完成，刷新用户信息并跳转
          server.getUserInfo()
            .then(res => {
              var data = res.data;
              utils.log(data);
              setUserInfo({
                ...userInfo,
                plan: data.plan,
              });
            })
            .finally(() => {
              navigate("/table", { replace: true });
            });
        }
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [userInfo, navigate, setUserInfo]);
  
  // 备用方案：如果iframe加载后仍有文字，尝试使用更激进的CSS

  return(
    <div style={{width: '100%', minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', position: 'relative'}}>
      {show && paymentHtml ? (
        <div style={{width: '205px', maxWidth: '200px', height: '205px', position: 'relative', textAlign: 'center', margin: '0 auto'}}>
          {
            isLoading &&
            <Flex align="center" justify="center" style={{position: 'absolute', width: '100%', height: '100%'}}>
              <Spin 
                indicator={<Icon.LoadingOutlined style={{ fontSize: 32, color: antdToken.colorPrimary }} spin />} 
              />
            </Flex>
          }
          <iframe
            ref={handleIframeLoad}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              backgroundColor: antdToken.colorBgContainer,
              overflow: 'hidden',
              margin: '0 auto',
              display: 'block',
              boxSizing: 'border-box',
            }}
            title="支付二维码"
            sandbox="allow-forms allow-scripts allow-same-origin"
          />
          <div style={{
            marginTop: '20px'
          }}>
            <Button type="primary" onClick={()=>{
              server.getUserInfo()
              .then(res=>{
                var data=res.data
                utils.log(data)
                setUserInfo({
                  ...userInfo,
                  plan:data.plan,
                })
                utils.log(data)
              })
              .finally(()=>{
                window.messageApi.success("资源点已刷新，请继续运行。")
                callBack && callBack()
                handleRefreshToken(false)
              })
            }}>已完成支付</Button>
          </div>
        </div>
      ) : (
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '200px'}}>
          <Spin 
            indicator={<Icon.LoadingOutlined style={{ fontSize: 32, color: antdToken.colorPrimary }} spin />} 
          />
          <div style={{marginTop: '16px', color: antdToken.colorTextSecondary}}>加载支付页面中...</div>
        </div>
      )}
    </div>
  )
}


function PayInPc({plan,finalPrice,callBack}:{plan:TypePlan,finalPrice:number,callBack?:()=>void}){
  const { token: antdToken } = antTheme.useToken();
  const [sdId,setSdId]=useState(0)
  const [showCheckPay,setShowCheckPay]=useState(false)

  const orderCreate=useCallback(()=>{
    setShowCheckPay(true)
  },[])

  if(showCheckPay){
    return <AfterPay mode={0} plan={{...plan,price:finalPrice}} callBack={()=>{
      setShowCheckPay(false)
      callBack && callBack()
    }}></AfterPay>
  }

  return(
    <Flex gap={"middle"} vertical>
      <Flex gap={"middle"} align="center">
        <Icon.CheckCircleFilled style={{color: antdToken.colorPrimary, fontSize:32}}></Icon.CheckCircleFilled>
        <Flex vertical>
          <Typography.Text strong>您已创建订单</Typography.Text>
          <Flex align="center" style={{color: antdToken.colorError}}>
            <Typography.Text style={{ color: antdToken.colorError }}>金额：</Typography.Text>
            <Typography.Text strong style={{ color: antdToken.colorError }}>￥{finalPrice}</Typography.Text>
          </Flex>
        </Flex>
      </Flex>
      <Flex>
        <PayItem id={0} sdId={sdId} setSelectedId={setSdId}
          src={IconAlipay}></PayItem>
      </Flex>
      <Button size="large" type="primary" onClick={orderCreate}>
        支付宝付款 ￥{finalPrice}
      </Button>
    </Flex>
  )
}

function PayInPhone({plan,finalPrice,callBack}:{plan:TypePlan,finalPrice:number,callBack?:()=>void}){
  const { token: antdToken } = antTheme.useToken();
  const [sdId,setSdId]=useState(0)
  const [showCheckPay,setShowCheckPay]=useState(false)

  const orderCreate=useCallback(()=>{
    setShowCheckPay(true)
  },[])
  if(showCheckPay){
    return(
      <AfterPay mode={1} plan={plan} callBack={callBack}></AfterPay>
    )
  }

  return(
    <Flex style={{width:"100%",height:"100%"}} justify="space-between" vertical gap={"middle"}>
      <Flex gap={"small"} vertical justify="center" align="center">
        <Typography.Text type="secondary">网上支付订单等待支付</Typography.Text>
        <Typography.Title level={5} style={{ margin: 0 }}>实付金额</Typography.Title>
        <Flex align="end">
          <Typography.Text style={{fontWeight:400, fontSize: antdToken.fontSizeLG + 12}}>￥</Typography.Text>
          <Typography.Title level={1} style={{margin: 0}}>{finalPrice}</Typography.Title>
        </Flex>
      </Flex>
      <Flex vertical>
        <Typography.Text>选择支付方式</Typography.Text>
        <PayItem id={0} sdId={sdId} setSelectedId={setSdId}
          src={IconAlipay}></PayItem>
      </Flex>
      <Button onClick={orderCreate} size="large" type="primary" style={{width:"100%"}}>支付宝支付￥{finalPrice}</Button>
    </Flex>
  )
}

function PayItem({id,sdId,setSelectedId,src}:{id:number,sdId:number,setSelectedId:Dispatch<number>,src:string}){
  return(
    <Card style={{width:"min"}}>
      <Flex align="center">
        <Radio checked={sdId==id} onClick={()=>{
          setSelectedId(id)
        }}></Radio>
        <img style={{width:"30%"}} src={src}></img>
      </Flex>
    </Card>
  )
}


function InfoPlan({plan,planItems,indexSelected,discount,selectedId,setSelectedId}:{plan:TypePlan,planItems:TypePlanItem[],indexSelected:number,discount:number,selectedId:number,setSelectedId:Dispatch<SetStateAction<number>>}){
  const { token: antdToken } = antTheme.useToken();
  // 资源包名称映射
  const planNames = ['基础包', '高级包', '专业包', '无限包']
  const planColors = ['#52c41a', '#1890ff', '#722ed1', '#fa541c', '#9254de']
  // const planIcons = ['🌱', '⭐', '👑', '💎', '☯️']
  const planIcons = ['', '', '', '', '']
  const isSelected = selectedId === indexSelected
  const isUnlimited = plan?.name === "无限包" || plan?.id === 999
  
  // 计算额外资源点数（相对于基础包）
  const getExtraTokens = () => {
    if (indexSelected === 1) { // 高级包
      return 400 // 高级包多得400资源点
    }
    if (indexSelected === 2) { // 专业包
      return 800 // 专业包多得800资源点
    }
    return 0
  }
  const extraTokens = getExtraTokens()
  return(
    <Card 
      className={`plan-card ${isSelected ? 'selected' : ''}`}
      style={{
        height: '120px',
        borderRadius: '8px',
        borderColor: isSelected ? planColors[indexSelected] : antdToken.colorBorderSecondary,
        borderWidth: isSelected ? '2px' : '1px',
        boxShadow: isSelected 
          ? `${antdToken.boxShadowSecondary}, 0 0 0 1px ${planColors[indexSelected]}33`
          : antdToken.boxShadowSecondary,
        transition: 'all 0.2s ease',
        cursor: 'pointer',
        background: isSelected ? antdToken.colorFillQuaternary : antdToken.colorBgContainer
      }}
      bodyStyle={{ padding: '12px', height: '100%' }}
      onClick={() => setSelectedId(indexSelected)}
    >
      <Flex align="center" justify="space-between" style={{ height: '100%' }}>
        {/* 左侧：单选按钮 + 资源包信息 */}
        <Flex align="center" gap="small" style={{ flex: 1, minWidth: 0 }}>
          <Radio 
            checked={isSelected}
            onChange={() => setSelectedId(indexSelected)}
            style={{
              color: isSelected ? planColors[indexSelected] : undefined
            }}
          />
          <span style={{ fontSize: antdToken.fontSizeLG + 4 }}>{planIcons[indexSelected]}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ 
              fontWeight: 'bold',
              color: isSelected ? planColors[indexSelected] : antdToken.colorText,
              marginBottom: '3px',
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              fontSize: antdToken.fontSizeLG,
            }}>
              {planNames[indexSelected] || `资源包${indexSelected + 1}`}
                          {/* 营销标签：多得XXX资源点 */}
              {(typeof extraTokens === 'number' && extraTokens > 0) && (
                <span style={{
                  padding: '1px 4px',
                  backgroundColor: antdToken.colorError,
                  color: antdToken.colorTextLightSolid,
                  borderRadius: '8px',
                  fontSize: antdToken.fontSizeSM,
                  fontWeight: 'bold',
                  whiteSpace: 'nowrap'
                }}>
                  加赠{extraTokens >= 1e4 ? (extraTokens/config.tokenRatio) : extraTokens}到手{planItems[0].counts[indexSelected]/config.tokenRatio}
                </span>
              )}
            </div>
            <div style={{ fontSize: antdToken.fontSizeSM, color: antdToken.colorTextSecondary }}>
              {
                 (
                  <div>
                    {/* 突出显示资源点数量 */}
                    {planItems.map((item,index)=>{
                      const count = item.counts[indexSelected]
                      if(count <= 0 || index !== 0) return null // 只显示第一个项目（资源点）
                      return (
                        <span key={index} style={{
                          fontSize: antdToken.fontSize,
                          fontWeight: 'bold',
                          color: planColors[indexSelected],
                          // display: 'flex',
                          // alignItems: 'center',
                        }}>
                          <span key={index} style={{
                            fontSize: antdToken.fontSizeLG + 8,
                            fontWeight: 'bold',
                            color: planColors[indexSelected]
                          }}>
                            共计{count/config.tokenRatio}
                          </span>
                          <span>{item.unit}{item.name}</span>
                          {/* 技术支持次数作为辅助信息 */}
                          {planItems.map((item,index)=>{
                            const count = item.counts[indexSelected]
                            if(count <= 0 || index !== 1) return null // 只显示第二个项目（技术支持）
                            return (
                              <span key={index} style={{
                                marginLeft: '6px',
                                fontSize: antdToken.fontSizeSM,
                                color: antdToken.colorTextTertiary
                              }}>
                                + {count}{item.unit}{item.name}
                              </span>
                            )
                          })}
                        </span>
                      )
                    })}
                  </div>
                )
              }
            </div>
          </div>
        </Flex>

        {/* 右侧：价格 */}
        <div style={{ textAlign: 'right', minWidth: '70px' }}>
          {discount < 100 && !isUnlimited && (
            <div style={{
              color: antdToken.colorTextTertiary,
              fontSize: antdToken.fontSizeSM,
              textDecoration: "line-through",
              lineHeight: 1,
              fontWeight: 'bold',
            }}>
              ¥{plan?.price || 0}
            </div>
          )}
          <div style={{
              fontSize: antdToken.fontSizeLG + 6,
              fontWeight: 'bold',
              color: isSelected ? planColors[indexSelected] : antdToken.colorText,
              lineHeight: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '2px'
            }}>
            ¥{isUnlimited ? UNLIMITED_PLAN_PRICE : ((plan?.price || 0) * discount / 100).toFixed(0)}
            {discount < 100 && !isUnlimited && (
              <span style={{
                padding: '2px 4px',
                backgroundColor: antdToken.colorError,
                color: antdToken.colorTextLightSolid,
                borderRadius: '2px',
                fontSize: Math.max(antdToken.fontSizeSM - 2, 10)
              }}>
                {(discount/10).toFixed(1)}折
              </span>
            )}
          </div>
        </div>
      </Flex>
    </Card>
  )
}
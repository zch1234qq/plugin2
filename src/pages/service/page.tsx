import { Flex } from "antd";
import { ItemProtocol } from "../../components/ItemProtocol";
import ComBar from "../../components/ComBar";
import ComQRGroup from "../../components/ComQRGroup";

type Item={
  name:string,
  contents:string[]
}
const items:Item[]=[
  {
    name:"接受条款",
    contents:[
      "本协议适用于您使用aditor（以下简称“本服务”）的所有行为。访问或使用本服务即视为您已阅读、理解并同意受本协议约束。",
      "如您不同意本协议内容，请立即停止使用本服务。"
    ]
  },
  {
    name:"服务内容",
    contents:[
      "本服务通过在线的软件服务帮助您快速构建自己的应用",
      "我们保留随时修改、暂停或终止服务的权利，无需提前通知。",
    ]
  },
  {
    name:"年龄限制",
    contents:[
      "禁止未成年人使用",
      " 您确认在注册时已年满18周岁。未满18周岁的个人禁止访问或使用本服务。",
      "如果我们发现用户未满18周岁，将立即终止其账户并删除相关数据，且不承担任何责任。",
    ]
  },
  {
    name:"付费条款",
    contents:[
      "费用与支付",
      "部分服务需付费使用，具体价格以页面公示为准。",
      "您需通过指定支付方式（如信用卡、第三方支付平台）完成付款，并承担可能的交易手续费。",
    ]
  },
  {
    name:"退款政策",
    contents:[
      "我们将根据您所购套餐中未使用的token数量，按比例进行退款。（1资源=1000token）",
      "若您对扣款有异议，请在7天内联系客服处理。"
    ]
  },
  {
    name:"价格变动",
    contents:[
      "我们保留调整服务价格的权利，调整后的价格将在生效前3天通过网站公告或邮件通知。"
    ]
  },
  {
    name:"免责声明",
    contents:[
      "服务使用风险",
      "本服务按“现状”提供，不保证其持续性、无错误或安全性。您使用本服务需自行承担风险。",
      "用户行为责任",
      "您需对使用本服务产生的所有行为及内容负责，我们不对用户行为导致的任何直接或间接损失承担责任。",
      "第三方内容与链接",
      "本服务可能包含第三方内容或链接，我们不对其准确性、合法性负责，访问第三方资源的风险由您自行承担。",
      "不可抗力",
      "因自然灾害、网络攻击、政府行为等不可抗力导致的服务中断或数据丢失，我们不承担责任。",
    ]
  },
  {
    name:"协议修改与终止",
    contents:[
      "我们有权随时修改本协议，修改后的协议将在网站公示后生效。",
      "您可随时终止账户，但我们不退还已支付费用（法律另有规定除外）。",
      "我们保留因您违反本协议而暂停或终止您账户的权利。",
    ]
  },
  {
    name:"其他条款",
    contents:[
      "知识产权：本服务所有内容（包括文字、代码、设计等）均受知识产权法保护，未经授权不得复制或商用。",
      "隐私政策：您的个人信息处理规则详见《隐私政策》。",
      "管辖法律：本协议受法律管辖，争议提交至辽宁省盘锦市双台子区人民法院。",
    ]
  },
  {
    name:"补充",
    contents:[
      "请再次确认您已年满18周岁且同意上述条款。如有疑问，请联系我们",
      "联系方式：133-2405-2902",
      "联系人：春辉",
      "运营主体：电分科技（盘锦）有限公司",
    ]
  }
]

export default function Service({}) {
  return(
    <Flex justify="center" style={{height:"100%"}}>
      <ComBar></ComBar>
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",overflow:"auto",margin:10}}>
          <h2>用户协议</h2>
          <Flex>
            <div>更新日期：</div>
            <div>2025年3月14日</div>
          </Flex>
          <Flex>
            <div>生效日期：</div>
            <div>2025年3月14日</div>
          </Flex>
          <ItemProtocol items={items}></ItemProtocol>
        <ComQRGroup></ComQRGroup>
      </div>
    </Flex>
  )
}

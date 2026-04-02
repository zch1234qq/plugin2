import Data1 from "../../components/node/input/data1";
import Time from "../../components/node/input/time";
import PromptImg from "../../components/node/AI/promptImg";
import PromptImgConst from "../../components/node/AI/promptImgConst";
import InImg from "../../components/node/input/inImg";
import Out from "../../components/node/output";
import In1 from "../../components/node/input/input1";
import Prompt1 from "../../components/node/AI/prompt1";
import { Packaging } from "../classes";
import Concat from "../../components/node/concat";
import ConcatColumn from "../../components/node/table/concatColumn";
import OCR from "../../components/node/AI/ocr";
import OCR2MD from "../../components/node/AI/img2md";
import Http from "../../components/node/http";
import InFile from "../../components/node/input/inFile";
import FileGroup from "../../components/node/input/inFileGp";
import Search from "../../components/node/AI/search";
import Wait from "../../components/node/wait";
import DbWrite from "../../components/node/mem/dbWrite";
import DbRead from "../../components/node/mem/dbRead";
import DbList from "../../components/node/input/dbList";
import DbWriteCloud from "../../components/node/mem/dbWriteCloud";
import DbReadCloud from "../../components/node/mem/dbReadCloud";
import Display from "../../components/node/display";
import Download from "../../components/node/download";
import Loop from "../../components/node/loop";
import AudioPlayer from "../../components/node/audioPlayer";
import ImageGroup from "../../components/node/input/inImgGp/index";
import Camera from "../../components/node/input/camera";
import Named from "../../components/node/named";
import { Edge, NodeOrigin } from "@xyflow/react";
import ImageCrop from "../../components/node/image/imageCrop";
import ScreenCapture from "../../components/node/input/screenCapture";
import ImgCompress from "../../components/node/image/imgCompress";
import Resize from "../../components/node/resize";
import CsvQuery from "../../components/node/table/csvQuery";
import TableIterator from "../../components/node/table/tableIterator";
import CheckData from "../../components/node/checkData";
import ImageEnhance from "../../components/node/image/imageEnhance";
import ImageFilter from "../../components/node/image/imageFilter";
import ImageRotate from "../../components/node/image/imageRotate";
import Img2Table from "../../components/node/AI/img2Table";
import ExcelSheetExtractor from "../../components/node/excelSheetExtractor";
import TableIterator2 from "../../components/node/table/tableIterator2";
import CsvDeleteRowCol from "../../components/node/table/csvDeleteRowCol";
import FileName from "../../components/node/fileName";
import CsvExtractor from "../../components/node/table/csvSelected";
import DbWriteCsv from "../../components/node/mem/dbWriteCsv";
import DbListCsv from "../../components/node/mem/dbListCsv";
import MergeCall from "../../components/node/mergeCall";
import ImageComposite from "../../components/node/image/imageComposite";
import LongCode from "../../components/node/AI/img2longCode";
import CsvJsonConverter from "../../components/node/table/csvJsonConverter";
// import InImgOrig from "../../components/node/input/inImgOrig";
import PythonExecutor from "../../components/node/pythonExecutor";
import TransposeTable from "../../components/node/table/transposeTable";
import ImgToRow from "../../components/node/AI/imgToRow";
import ImgToColumn from "../../components/node/AI/imgToColumn";
import AddIndexColumn from "../../components/node/table/addIndexColumn";
import TextToRow from "../../components/node/AI/textToRow";
import CsvSort from "../../components/node/table/csvSort"; // 导入 CSV 排序节点组件
import CsvDedup from "../../components/node/table/csvDedup";
import Judge from "../../components/node/func/judge";
import AddHeader from "../../components/node/table/addHeader";
import TextReplace from "../../components/node/func/textReplace";
import JavaScriptExecutor from "../../components/node/javascriptExecutor";
import Fapiao from "../../components/node/AI/fapiao";

export type GraphData={
  nodes:NodeCus[],edges:Edge[],
}

export type TypeAverageCost={
  count:number
  average:number
}

export type TypeNotice={
  id:string,
  message:React.ReactNode,
  type:string,
  show:boolean,
  endtime?:number
}

export type LLMApiType =
  | "ollama"
  | "openai"
  | "deepseek"

export type ConfigLLM={
  local:boolean,
  apiurl:string,
  text:TypeDetailLLM,
  img:TypeDetailLLM,
  search:TypeDetailLLM,
  ocr:TypeDetailLLM,
}

export type TypeDetailLLM={
  apiurl:string,
  model:string,
  apiType?:LLMApiType,
  apikey?:string,
}

export type TypeRespLLM={
  done:boolean,
  done_reason:string,
  response:string
}


export type RecordPlugins=Record<any,Packaging>
export class Relation{
  to:string="";
  handle:string="";
  handleTarget:string="";
  handleSource:string="";
  input?:string
}

export type TypeMsg="img"|"md"|"text"|"excel"|"audio"|"latest"
export type TypeFileInfos=Record<TypeMsg,any>

export type Res={
  code?:number,
  success:boolean,
  msg:string,
  msgtype?:TypeMsg,
  msgtypeRe?:TypeMsg,
  attached?:Record<string,unknown>,
  loopIteration?:number,
  countLoop?:number,
  skip?:boolean,
  continue?:boolean,
  datas?:Record<string,string>
  fileInfo?:TypeFileInfos,
  fromNodeId?:string,
  headers?:string
}

export type ConnectionCus={
  target:string,
  source:string,
  targetHandle:string,
  sourceHandle:string
}

export type HandleWrapRes={
  beginId:string,
  handle:string,
  res:Res,
}

export type EventHandleWraps=(argv:HandleWrapRes)=>void
export type NodeCus={
  type: EnumNodeType;
  id: string;
  orignin?:NodeOrigin
  position: {
      x: number;
      y: number;
  };
  data: NodeData,
  dragging?: boolean;
}

export type DataGeneral={
  success:boolean
  message:string
  /**
   * 兼容不同后端返回字段
   * - 旧接口常用 message
   * - 云端记忆接口可能返回 msg / value / password
   */
  msg?:string
  value?:string
  password?:string
}

export type DataCloudReadItem = {
  timestamp: string
  value: string
}

export type DataCloudRead = {
  success: boolean
  message: string
  data?: DataCloudReadItem[]
  total?: number
}
export type DataShareCreate={
  success:boolean,
  message:string,
  code:string
}
export type DataShareVisit={
  success:boolean,
  message:string,
  plugjson:string
}

export type DataPresignUrl={
  success:boolean
  message:string
  data:{
    method:string
    expiration:string
    url:string
    signed_headers:Record<string,string>
  }
}

export type DataActivate={
  success:boolean
  message:string
  tokencurrent:number
  plan:TypePlan
}

export type DataSms={
  success:boolean
  success_verify_cap:boolean
  message:string
}

export type DataUse={
  success:boolean
  message:string
  plugin:Packaging
}

export type DataLog={
  success:boolean
  message:string
  token:string
  token_count:number
  adminid:string
  user:TypeUserInfo
  created:Packaging[]
}

export interface TypeUserInfo{
  adminid:string
  phone:string
  published:string[]
  created:string[]
  collected:string[]
  plan:TypePlan
  tokenfree:number
  lastLogin?:number // 最后登录时间戳，可选字段
}

type DataRun={
  success:boolean
  message:string
  answer:string
}
export type DataPlanConfig={
  ratio:number
  plans:TypePlan[]
  pricecurve:number[]
}

// 添加发布请求的响应类型
export type DataPublish = {
  success: boolean
  message: string
  published_id?: number  // 发布后的 ID，可选
  version?: number       // 发布版本号，可选
} 

export type DataGpt={
  success:boolean
  message:string
  code?:number
  msg:string
  total_tokens:number
}

// 后端发票识别（/ocr/vat_invoice）响应类型
export type DataVatInvoiceOcr = {
  success: boolean
  message: string
  // 兼容不同后端返回：有的返回 msg(JSON字符串)，有的返回 data(对象)
  msg?: any
  data?: any
}

// 后端发票识别（/ocr/vat_invoice）请求参数
export type ReqVatInvoiceOcr = {
  img: string
  // 是否识别印章信息
  seal_tag?: boolean
  taskid?: string
  sharer?: string
}

export type DataMqRb={
  success:boolean
  taskid:string
}

export type DataMqQuery={
  success:boolean
  message:string
  data:string
}

export type DataGetToken={
  success:boolean
  message:string
  tokencurrent:number
  timeexpire:number
  plan:TypePlan
}

export type DataGetuserinfo={
  success:boolean,
  counttoken:number,
  created:Packaging[],
  published:Packaging[],
  favorited:Packaging[],
  plan:TypePlan
}

export type DataGetPublished={
  success:boolean,
  message:string,
  plugin:Packaging
}

export type DataGetPublishedList={
  success:boolean,
  message:string,
  plugins:Packaging[]
}

export type DataGetLatestStatus={
  success:boolean,
  message:string,
  counttoken:number,
  statussave:{
    items:{
      uuid:string,
      time_update:number
    }[],
    time_update:number
  }
}

export type ResGpt={
  data:DataGpt
}

export type ResUse={
  data:DataUse
}
export type ResRun={
  data:DataRun
}
export type ResGetuserinfo={
  data:DataGetuserinfo
}


export type TypeRes<T>={
  data:T
}
export type TypeCaptchaRes={
  captchaResult:boolean,
  bizResult:boolean
}

export type TypePromise<T> = Promise<TypeRes<T>>;

export type NodeData={
  values:Record<number,string>,
  sharer?:string,
  appid?:string,
  label:EnumNodeType,
  relations:Record<string,Relation[]>,
  rels2:Record<string,Relation[]>,
  edgeS2T:Record<string,Relation[]>
}

export enum EnumNodeType{
  In="in",
  Out="out",
  Concat="concat",
  Data="data",
  Time="time",
  Prompt="prompt",
  OCR="ocr",
  MdFromImg="mdFromImg",
  PromptImg="promptImg",
  PromptImgConst="promptImgConst",
  InImg="inImg",
  Search="search",
  InFile="inFile",
  InFileGp="inFileGp", // 添加文件组节点类型
  Func010="func010",
  Http="http",
  Wait = "wait",
  DbWrite = "dbWrite",
  DbRead = "dbRead",
  DbList = "dbList",
  Display = "display",
  Download = "download",
  Loop = "loop",
  InImgGp = "inImgGp",
  AudioPlayer = "audioPlayer",
  Camera="camera",
  Python="python",
  JavaScript="javascript",
  Database = "database", // 添加数据库节点类型
  OneWay = "oneWay", // 添加单向节点类型
  Named = "named", // 添加命名节点类型
  // InImgOrig = "inImgOrig", // 添加原图压缩节点类型
  ImageCrop = "imageCrop", // 添加图片裁剪节点类型
  ScreenCapture = "screenCapture", // 添加屏幕观察节点类型
  ImgCompress = "imgCompress", // 添加图片压缩节点类型
  Resize = "resize", // 添加调整尺寸节点类型
  CsvQuery = "csvQuery", // 添加CSV查询节点类型
  TableIterator = "tableIterator", // 添加表格遍历节点类型
  CheckData = "checkData", // 添加核对节点类型
  ImageEnhance = "imageEnhance", // 添加图像增强节点类型
  ImageFilter = "imageFilter", // 添加图像过滤器节点类型
  ImageRotate = "imageRotate",
  Img2Table = "img2Table", // 添加图片转表格节点类型
  ExcelSheetExtractor = "excelSheet", // 添加Excel工作表提取节点类型
  TableIterator2 = "tableIterator2", // 添加表格遍历2.0节点类型
  CsvDeleteRowCol = "csvDeleteRowCol", // 添加CSV行列删除节点类型
  FileName = 39, // 添加文件名节点类型
  CsvExtractor = "csvExtractor", // 添加CSV行列提取节点类型
  DbWriteCsv = "dbWriteCsv", // 新增节点类型
  DbListCsv = "dbListCsv", // 新增节点类型
  ConcatColumn = "concatColumn", // 新增拼接列节点类型
  MergeCall = "mergeCall", // 新增合并调用节点类型
  ImageComposite = "imageComposite",
  LongCode = "longCode",
  CsvJsonConverter = "csvJsonConverter", // 新增CSV-JSON转换节点类型
  TransposeTable = "transposeTable", // 新增表格转置节点类型
  ImgToRow = "imgToRow", // 新增图片转表格行节点类型
  ImgToColumn = "imgToColumn", // 新增图片转表格列节点类型
  AddIndexColumn = "addIndexColumn", // 新增表格添加序号列节点类型
  Judge = "judge", // 添加判断节点类型
  TextToRow = "textToRow", // 添加文字转表格行节点类型
  AddHeader = "addHeader", // 添加添加表头节点类型
  DbWriteCloud = "dbWriteCloud", // 添加云端共享写入节点类型
  DbReadCloud = "dbReadCloud", // 添加云端共享读取节点类型
  CsvSort = "csvSort", // 添加CSV排序节点类型
  CsvDedup = "csvDedup", // 表格去重：按字段名去重并移除重复行
  TextReplace = "textReplace", // 文本替换
  Fapiao = "fapiao", // 发票识别
}
export const RecordMsgType:Record<EnumNodeType,TypeMsg>={
  [EnumNodeType.DbWrite]:"excel",
  [EnumNodeType.DbRead]:"excel",
  [EnumNodeType.DbList]:"excel",
  [EnumNodeType.In]:"text",
  [EnumNodeType.InImg]:"img",
  [EnumNodeType.InFile]:"text",
  [EnumNodeType.InFileGp]:"text", // 添加文件组节点类型消息类型
  [EnumNodeType.Data]:"text",
  [EnumNodeType.Time]:"text",
  [EnumNodeType.Camera]:"img",
  [EnumNodeType.ScreenCapture]:"img",
  [EnumNodeType.ImgCompress]:"img",
  [EnumNodeType.Resize]:"img",
  [EnumNodeType.CsvQuery]:"excel",
  [EnumNodeType.TableIterator]:"excel",
  [EnumNodeType.CheckData]:"excel",
  [EnumNodeType.ImageEnhance]:"img",
  [EnumNodeType.ImageFilter]:"img",
  [EnumNodeType.ImageRotate]:"img",
  [EnumNodeType.Img2Table]:"excel",
  [EnumNodeType.ExcelSheetExtractor]:"excel",
  [EnumNodeType.TableIterator2]:"excel",
  [EnumNodeType.CsvDeleteRowCol]:"excel",
  [EnumNodeType.FileName]:"text",
  [EnumNodeType.CsvExtractor]:"excel",
  [EnumNodeType.DbWriteCsv]:"excel",
  [EnumNodeType.DbListCsv]:"excel",
  [EnumNodeType.ConcatColumn]:"excel",
  [EnumNodeType.ImgToRow]:"excel",
  [EnumNodeType.ImgToColumn]:"excel",
  [EnumNodeType.CsvJsonConverter]:"text",
  [EnumNodeType.TransposeTable]:"excel",
  [EnumNodeType.ImageComposite]:"img",
  [EnumNodeType.MergeCall]:"text",
  [EnumNodeType.LongCode]:"text",
  [EnumNodeType.TextToRow]:"excel",
  [EnumNodeType.Out]:"text",
  [EnumNodeType.Concat]:"latest",
  [EnumNodeType.Prompt]:"text",
  [EnumNodeType.OCR]:"text",
  [EnumNodeType.MdFromImg]:"text",
  [EnumNodeType.PromptImg]:"text",
  [EnumNodeType.PromptImgConst]:"text",
  [EnumNodeType.Search]:"text",
  [EnumNodeType.Func010]:"text",
  [EnumNodeType.Http]:"text",
  [EnumNodeType.Wait]:"latest",
  [EnumNodeType.Display]:"img",
  [EnumNodeType.Download]:"latest",
  [EnumNodeType.Loop]:"text",
  [EnumNodeType.InImgGp]:"img",
  [EnumNodeType.AudioPlayer]:"audio",
  [EnumNodeType.Python]:"text",
  [EnumNodeType.JavaScript]:"text",
  [EnumNodeType.Database]:"text",
  [EnumNodeType.OneWay]:"text",
  [EnumNodeType.Named]:"latest",
  [EnumNodeType.ImageCrop]:"img",
  [EnumNodeType.AddIndexColumn]:"excel", // 新增表格添加序号列节点消息类型
  [EnumNodeType.Judge]:"text" ,// 判断节点消息类型
  [EnumNodeType.AddHeader]:"excel", // 添加添加表头节点类型描述
  [EnumNodeType.CsvSort]:"excel", // 添加CSV排序节点消息类型 // 添加添加表头节点类型描述
  // [EnumNodeType.InImgOrig]:"img",
  [EnumNodeType.DbWriteCloud]:"excel", // 云端共享写入节点消息类型
  [EnumNodeType.DbReadCloud]:"excel", // 云端共享读取节点消息类型
  [EnumNodeType.TextReplace]:"text",
  [EnumNodeType.Fapiao]:"text",
  [EnumNodeType.CsvDedup]:"excel",
}
export const RecordNodeType:Record<EnumNodeType,string>={
  [EnumNodeType.In]:"输入",
  [EnumNodeType.Concat]:"拼接",
  [EnumNodeType.Data]:"数据",
  [EnumNodeType.Prompt]:"prompt",
  [EnumNodeType.OCR]:"ocr",
  [EnumNodeType.MdFromImg]:"图片转md",
  [EnumNodeType.PromptImg]:"prompt图片",
  [EnumNodeType.PromptImgConst]:"prompt图片常量",
  [EnumNodeType.InImg]:"输入图片",
  [EnumNodeType.Func010]:"prompt解图",
  [EnumNodeType.Http]:"http",
  [EnumNodeType.InFile]:"输入文件",
  [EnumNodeType.InFileGp]:"文件组", // 添加文件组节点显示名称
  [EnumNodeType.Search]:"搜索引擎",
  [EnumNodeType.Wait]: "等待",
  [EnumNodeType.DbWrite]: "写记忆",
  [EnumNodeType.DbRead]: "读记忆",
  [EnumNodeType.DbList]: "全部记忆",
  [EnumNodeType.Display]: "显示",
  [EnumNodeType.Download]: "下载",
  [EnumNodeType.Loop]: "循环",
  [EnumNodeType.InImgGp]: "图片组",
  [EnumNodeType.AudioPlayer]: "提示音",
  [EnumNodeType.Out]:"输出",
  [EnumNodeType.Camera]: "视觉",
  [EnumNodeType.Python]: "python",
  [EnumNodeType.JavaScript]: "javascript",
  [EnumNodeType.Database]: "数据库",
  [EnumNodeType.OneWay]: "单向", // 添加单向节点显示名称
  [EnumNodeType.Named]: "命名", // 添加命名节点标签
  [EnumNodeType.ImageCrop]: "裁剪", // 添加图片裁剪节点显示名称
  [EnumNodeType.ScreenCapture]: "观察", // 添加屏幕观察节点显示名称
  [EnumNodeType.ImgCompress]: "压缩",
  [EnumNodeType.Resize]: "调尺寸", // 添加调整尺寸节点显示名称
  [EnumNodeType.CsvQuery]: "CSV查询", // 添加CSV查询节点显示名称
  [EnumNodeType.TableIterator]: "表格遍历", // 添加表格遍历节点标签
  [EnumNodeType.CheckData]: "核对数据", // 添加核对节点显示名称
  [EnumNodeType.ImageEnhance]: "图像增强", // 添加图像增强节点类型描述
  [EnumNodeType.ImageFilter]: "图像过滤器", // 添加图像过滤器节点类型描述
  [EnumNodeType.ImageRotate]: "旋转",
  [EnumNodeType.Img2Table]: "图片转表格", // 添加图片转表格节点类型描述
  [EnumNodeType.ExcelSheetExtractor]: "取表", // 添加显示名称
  [EnumNodeType.TableIterator2]: "遍历2", // 添加显示名称
  [EnumNodeType.CsvDeleteRowCol]: "删除", // 添加显示名称
  [EnumNodeType.FileName]: "文件名", // 添加文件名节点标签
  [EnumNodeType.CsvExtractor]: "提取", // 添加新节点显示名称
  [EnumNodeType.DbWriteCsv]: "写记忆(表格)", // 新增节点名称
  [EnumNodeType.DbListCsv]: "全部记忆(表格)", // 新增节点名称
  [EnumNodeType.ConcatColumn]: "拼接列", // 新增拼接列节点名称
  [EnumNodeType.MergeCall]: "合并调用", // 新增合并调用节点名称
  [EnumNodeType.ImageComposite]: "合成", // 新增图片合成节点名称
  [EnumNodeType.LongCode]: "长编码", // 新增长编码提取节点名称
  [EnumNodeType.CsvJsonConverter]: "CSV-JSON转换", // 新增CSV-JSON转换节点名称
  [EnumNodeType.TransposeTable]: "表格转置", // 新增表格转置节点名称
  [EnumNodeType.ImgToRow]: "图片转CSV", // 新增图片转CSV节点名称
  [EnumNodeType.ImgToColumn]: "图片转列", // 新增图片转列节点名称
  [EnumNodeType.AddIndexColumn]: "添加序号", // 新增表格添加序号列节点名称
  [EnumNodeType.Judge]: "判断", // 添加判断节点显示名称
  [EnumNodeType.TextToRow]: "文字转行", // 添加文字转表格行节点名称
  [EnumNodeType.AddHeader]: "添加表头", // 添加表头节点名称
  [EnumNodeType.CsvSort]: "排序", // 添加CSV排序节点名称
  [EnumNodeType.CsvDedup]: "去重", // 表格去重节点名称
  [EnumNodeType.TextReplace]: "替换文字", // 文本替换节点名称
  // [EnumNodeType.InImgOrig]: "原图", // 添加原图压缩节点名称   
  [EnumNodeType.Time]: "时间", // 添加时间节点分组
  [EnumNodeType.DbWriteCloud]: "写记忆(云端)", // 云端共享写入节点显示名称
  [EnumNodeType.DbReadCloud]: "读记忆(云端)", // 云端共享读取节点显示名称
  [EnumNodeType.Fapiao]: "发票识别", // 发票识别节点显示名称
}

export const RecordGroupNameOfNode:Record<EnumNodeType,string>={
  [EnumNodeType.In]: "输入",
  [EnumNodeType.InImg]: "输入",
  [EnumNodeType.InFile]: "输入",
  [EnumNodeType.InFileGp]: "输入", // 添加文件组节点分组
  [EnumNodeType.InImgGp]: "输入",
  //  [EnumNodeType.InImgOrig]: "输入", // 添加原图压缩节点分组
  [EnumNodeType.DbRead]: "输入",
  [EnumNodeType.DbReadCloud]: "输入", // 云端读取节点分组
  [EnumNodeType.DbList]: "输入",
  [EnumNodeType.Data]: "输入",
  [EnumNodeType.Time]: "输入", // 添加时间节点分组
  [EnumNodeType.Camera]: "输入",
  [EnumNodeType.ScreenCapture]: "输入",
  
  [EnumNodeType.ImageCrop]: "图片",
  [EnumNodeType.ImgCompress]: "图片",
  [EnumNodeType.Resize]: "图片",
  [EnumNodeType.ImageEnhance]: "图片",
  [EnumNodeType.ImageFilter]: "图片",
  [EnumNodeType.ImageRotate]: "图片",
  [EnumNodeType.ImageComposite]: "图片",
  
  [EnumNodeType.Prompt]: "AI",
  [EnumNodeType.OCR]: "AI",
  [EnumNodeType.PromptImg]: "AI",
  [EnumNodeType.PromptImgConst]: "AI",
  [EnumNodeType.ImgToRow]: "AI",
  [EnumNodeType.ImgToColumn]: "AI",
  [EnumNodeType.Img2Table]: "AI",
  [EnumNodeType.MdFromImg]: "AI",
  [EnumNodeType.Search]: "AI",
  [EnumNodeType.LongCode]: "AI",
  [EnumNodeType.TextToRow]: "AI",
  [EnumNodeType.Fapiao]: "AI",
  
  [EnumNodeType.CsvQuery]: "表格",
  [EnumNodeType.TableIterator]: "表格",
  [EnumNodeType.TableIterator2]: "表格",
  [EnumNodeType.CheckData]: "表格",
  [EnumNodeType.ExcelSheetExtractor]: "表格",
  [EnumNodeType.CsvDeleteRowCol]: "表格",
  [EnumNodeType.CsvExtractor]: "表格",
  [EnumNodeType.ConcatColumn]: "表格",
  [EnumNodeType.CsvJsonConverter]: "表格",
  [EnumNodeType.DbWriteCsv]: "表格",
  [EnumNodeType.DbListCsv]: "表格",
  [EnumNodeType.TransposeTable]: "表格",
  [EnumNodeType.AddIndexColumn]: "表格", // 将新节点添加到表格分组
  [EnumNodeType.AddHeader]: "表格", // 将新节点添加到表格分组
  [EnumNodeType.CsvSort]: "表格", // 将CSV排序节点添加到表格分组
  [EnumNodeType.CsvDedup]: "表格",
  
  [EnumNodeType.Display]: "功能",
  [EnumNodeType.Http]: "功能",
  [EnumNodeType.Loop]: "功能",
  [EnumNodeType.Concat]: "功能",
  [EnumNodeType.Named]: "功能",
  [EnumNodeType.FileName]: "功能",
  [EnumNodeType.Python]: "功能",
  [EnumNodeType.JavaScript]: "功能",
  [EnumNodeType.Database]: "功能",
  [EnumNodeType.OneWay]: "功能",
  [EnumNodeType.MergeCall]: "功能",
  [EnumNodeType.Judge]: "功能", // 将判断节点添加到功能分组
  [EnumNodeType.TextReplace]: "功能", // 文本替换归入功能
  
  [EnumNodeType.AudioPlayer]: "透明",
  [EnumNodeType.Download]: "透明",
  [EnumNodeType.Wait]: "透明",
  [EnumNodeType.DbWrite]: "透明",
  [EnumNodeType.DbWriteCloud]: "透明", // 云端共享写入节点分组
  [EnumNodeType.Func010]: "透明",
  
  [EnumNodeType.Out]: "输出"
}


export type TypeImages={
  pri:string,
  sub:string
}
export interface TypePlan{
  timeexpire:number
  id: number;
  name: string;
  price: number
  counttoken:number
  countsupport:number
  countsearch:number
  countpromptimg:number

}
export interface TypePlanShow{
  name: string;
  token:number
  unit:string
  price:number
}

export enum EnumProtocls{
  Privacy="隐私政策",
  Service="用户协议",
}

export const RecordProtocolPages={
  [EnumProtocls.Privacy]:"/privacy",
  [EnumProtocls.Service]:"/service",
}

// export interface TypeDebug{
//   type?:string,
//   show:boolean
//   data:string
//   nodeId?:string,
//   nodeType?:string,
//   loading?:boolean
// }

export type TypeDebug = {
  show: boolean,
  data: string,
  loading: boolean,
  nodeId: string,
  nodeType: string,
  msgtype: TypeMsg,
  type?: string,
  success?: boolean
}


const ColorFunc="silver"
const ColorFuncTrans="transparent"
const ColorInput="#fff"
const ColorAI="lightblue"
export const ColorImgProcess="lightyellow"
export const ColorTable="lightgreen"
export const RecordNodeColor:Record<EnumNodeType,string>={
  [EnumNodeType.In]: ColorInput,
  [EnumNodeType.InImg]: ColorInput,
  [EnumNodeType.InImgGp]: ColorInput,
  [EnumNodeType.InFile]: ColorInput,
  [EnumNodeType.InFileGp]: ColorInput, // 添加文件组节点颜色，与InImgGp保持一致
  // [EnumNodeType.InImgOrig]: ColorInput, // 添加原图压缩节点颜色
  [EnumNodeType.Data]: ColorInput,
  [EnumNodeType.Time]: ColorInput,
  [EnumNodeType.Camera]: ColorInput,
  [EnumNodeType.ScreenCapture]: ColorInput, // 使用图片处理颜色
  [EnumNodeType.DbRead]: ColorInput,
  [EnumNodeType.DbReadCloud]: ColorInput, // 云端读取节点颜色
  [EnumNodeType.DbList]: ColorInput,
  [EnumNodeType.Out]: "black",
  [EnumNodeType.Concat]: "red",
  [EnumNodeType.Prompt]: ColorAI,
  [EnumNodeType.Img2Table]: ColorAI, // 使用图片处理颜色
  [EnumNodeType.OCR]: ColorAI,
  [EnumNodeType.MdFromImg]: ColorAI,
  [EnumNodeType.PromptImg]: ColorAI,
  [EnumNodeType.PromptImgConst]: ColorAI,
  [EnumNodeType.Search]: ColorAI,
  [EnumNodeType.TextToRow]: ColorAI,
  [EnumNodeType.Func010]: ColorFunc,
  [EnumNodeType.Http]: ColorFunc,
  [EnumNodeType.Display]: ColorFunc,
  [EnumNodeType.DbWrite]: ColorFuncTrans,
  [EnumNodeType.DbWriteCloud]: ColorFuncTrans, // 云端写入节点颜色
  [EnumNodeType.Wait]: ColorFuncTrans,
  [EnumNodeType.Download]: ColorFuncTrans,
  [EnumNodeType.AudioPlayer]: ColorFuncTrans,
  [EnumNodeType.Loop]: "#FF9800",
  [EnumNodeType.Python]: ColorFunc,
  [EnumNodeType.JavaScript]: ColorFunc,
  [EnumNodeType.Database]: "#1890ff", // 使用蓝色表示数据库节点
  [EnumNodeType.OneWay]: ColorFunc, // 使用已定义的功能节点颜色
  [EnumNodeType.Named]: ColorFunc, // 使用已定义的功能节点颜色
  [EnumNodeType.ImageCrop]: ColorImgProcess, // 使用图片处理颜色
  [EnumNodeType.ImgCompress]: ColorImgProcess, // 使用图片处理颜色
  [EnumNodeType.Resize]: ColorImgProcess, // 使用图片处理颜色
  [EnumNodeType.CsvQuery]: ColorTable, // 使用表格颜色
  [EnumNodeType.TableIterator]: ColorTable, // 使用表格颜色
  [EnumNodeType.CheckData]: ColorTable, // 使用功能节点颜色
  [EnumNodeType.ImageEnhance]: ColorImgProcess, // 使用图片处理颜色
  [EnumNodeType.ImageFilter]: ColorImgProcess, // 使用图片处理颜色
  [EnumNodeType.ImageRotate]: ColorImgProcess, // 使用图片处理颜色
  [EnumNodeType.ExcelSheetExtractor]: ColorTable, // 使用表格颜色
  [EnumNodeType.TableIterator2]: ColorTable, // 使用表格颜色
  [EnumNodeType.CsvDeleteRowCol]: ColorTable, // 使用表格颜色
  [EnumNodeType.FileName]: ColorFunc, // 使用功能节点颜色
  [EnumNodeType.CsvExtractor]: ColorTable, // 使用表格颜色
  [EnumNodeType.DbWriteCsv]: ColorTable, // 使用表格颜色
  [EnumNodeType.DbListCsv]: ColorTable, // 使用表格颜色
  [EnumNodeType.ConcatColumn]: ColorTable, // 使用表格颜色
  [EnumNodeType.MergeCall]: ColorFunc, // 使用功能节点颜色
  [EnumNodeType.ImageComposite]: ColorImgProcess, // 使用图片处理颜色
  [EnumNodeType.LongCode]: ColorAI, // 使用功能节点颜色
  [EnumNodeType.CsvJsonConverter]: ColorTable, // 使用表格颜色
  [EnumNodeType.TransposeTable]: ColorTable, // 使用表格颜色
  [EnumNodeType.ImgToRow]: ColorAI, // 使用AI节点颜色，与Img2Table保持一致
  [EnumNodeType.ImgToColumn]: ColorAI, // 使用AI节点颜色，与Img2Table保持一致
  [EnumNodeType.AddIndexColumn]: ColorTable, // 使用表格颜色
  [EnumNodeType.Judge]: ColorFunc, // 使用功能节点颜色
  [EnumNodeType.AddHeader]: ColorTable, // 使用表格颜色
  [EnumNodeType.CsvSort]: ColorTable, // 使用表格颜色
  [EnumNodeType.CsvDedup]: ColorTable, // 使用表格颜色
  [EnumNodeType.TextReplace]: ColorFunc, // 功能节点颜色
  [EnumNodeType.Fapiao]: ColorAI,
}

export const RecordNodeTextColor:Record<EnumNodeType,string>={
  [EnumNodeType.In]: "#000",
  [EnumNodeType.InImg]: "#000",
  [EnumNodeType.Data]: "#000",
  [EnumNodeType.Time]: "#000",
  [EnumNodeType.InFile]: "#000",
  // [EnumNodeType.InImgOrig]: "#000", // 添加原图压缩节点文本颜色
  [EnumNodeType.InFileGp]: "#333333", // 添加文件组节点文本颜色，与InImgGp保持一致
  [EnumNodeType.Out]: "#fff",
  [EnumNodeType.Concat]: "#fff",
  [EnumNodeType.Prompt]: "#000",
  [EnumNodeType.OCR]: "#000",
  [EnumNodeType.MdFromImg]: "#000",
  [EnumNodeType.PromptImg]: "#000",
  [EnumNodeType.PromptImgConst]: "#000",
  [EnumNodeType.Search]: "#000",
  [EnumNodeType.TextToRow]: "#000",
  [EnumNodeType.Func010]: "#000",
  [EnumNodeType.Http]: "#000",
  [EnumNodeType.Wait]: "#000",
  [EnumNodeType.DbWrite]: "#000",
  [EnumNodeType.DbWriteCloud]: "#000", // 云端写入节点文本颜色
  [EnumNodeType.DbRead]: "#000",
  [EnumNodeType.DbReadCloud]: "#000", // 云端读取节点文本颜色
  [EnumNodeType.DbList]: "#000",
  [EnumNodeType.Display]: "#000",
  [EnumNodeType.Download]: "#000",
  [EnumNodeType.Loop]: "#000",
  [EnumNodeType.InImgGp]: "#333333",
  [EnumNodeType.AudioPlayer]: "#000",
  [EnumNodeType.Camera]: "#000",
  [EnumNodeType.Python]: "#000",
  [EnumNodeType.JavaScript]: "#000",
  [EnumNodeType.Database]: "#fff", // 白色文字
  [EnumNodeType.OneWay]: "#000", // 黑色文字
  [EnumNodeType.Named]: "#fff", // 白色文字
  [EnumNodeType.ImageCrop]: "#000",
  [EnumNodeType.ScreenCapture]: "#000",
  [EnumNodeType.ImgCompress]: "#000",
  [EnumNodeType.Resize]: "#000", // 黑色文字
  [EnumNodeType.CsvQuery]: "#000", // 黑色文字
  [EnumNodeType.TableIterator]: "#000", // 黑色文字
  [EnumNodeType.CheckData]: "#000", // 黑色文字
  [EnumNodeType.ImageEnhance]: "#000", // 黑色文字
  [EnumNodeType.ImageFilter]: "#000", // 黑色文字
  [EnumNodeType.ImageRotate]: "#000", // 黑色文字
  [EnumNodeType.Img2Table]: "#000", // 黑色文字
  [EnumNodeType.ExcelSheetExtractor]: "#000", // 使用黑色文字
  [EnumNodeType.TableIterator2]: "#000", // 使用黑色文字
  [EnumNodeType.CsvDeleteRowCol]: "#000", // 使用黑色文字
  [EnumNodeType.FileName]: "#333", // 使用深灰色文字，提高可读性
  [EnumNodeType.CsvExtractor]: "#000", // 添加深色模式下的文字颜色
  [EnumNodeType.DbWriteCsv]: "#000", // 深色模式下的文字颜色
  [EnumNodeType.DbListCsv]: "#000", // 深色模式下的文字颜色
  [EnumNodeType.ConcatColumn]: "#000", // 深色模式下的文字颜色
  [EnumNodeType.MergeCall]: "#fff", // 白色文字，与橙红色背景形成对比
  [EnumNodeType.ImageComposite]: "#000", // 深色模式下的文字颜色
  [EnumNodeType.LongCode]: "#000", // 黑色文字
  [EnumNodeType.CsvJsonConverter]: "#000", // 黑色文字
  [EnumNodeType.TransposeTable]: "#000", // 使用黑色文字
  [EnumNodeType.ImgToRow]: "#000", // 黑色文字
  [EnumNodeType.ImgToColumn]: "#000", // 黑色文字
  [EnumNodeType.AddIndexColumn]: "#000", // 黑色文字
  [EnumNodeType.Judge]: "#000", // 黑色文字
  [EnumNodeType.AddHeader]: "#000", // 黑色文字
  [EnumNodeType.CsvSort]: "#000", // 黑色文字
  [EnumNodeType.CsvDedup]: "#000",
  [EnumNodeType.TextReplace]: "#000", // 黑色文字
  [EnumNodeType.Fapiao]: "#000",
}

export const RecordNodeLabel:Record<EnumNodeType,string>={
  [EnumNodeType.In]: "输入",
  [EnumNodeType.InImg]: "图片",
  [EnumNodeType.Data]: "常量",
  [EnumNodeType.Time]: "时间",
  [EnumNodeType.InFile]: "文件",
  //  [EnumNodeType.InImgOrig]: "原图", // 添加原图压缩节点标签
  [EnumNodeType.InFileGp]: "文件组", // 添加文件组节点标签
  [EnumNodeType.Out]: "输出",
  [EnumNodeType.Concat]: "拼接",
  [EnumNodeType.Prompt]: "文字",
  [EnumNodeType.OCR]: "OCR",
  [EnumNodeType.MdFromImg]: "图片转MD",
  [EnumNodeType.PromptImg]: "图片",
  [EnumNodeType.PromptImgConst]: "图片常量",
  [EnumNodeType.Search]: "搜索引擎",
  [EnumNodeType.TextToRow]: "文字转行",
  [EnumNodeType.Func010]: "解图",
  [EnumNodeType.Http]: "Http",
  [EnumNodeType.Wait]: "等待",
  [EnumNodeType.DbWrite]: "写记忆",
  [EnumNodeType.DbRead]: "读记忆",
  [EnumNodeType.DbList]: "全部记忆",
  [EnumNodeType.Display]: "显示器",
  [EnumNodeType.Download]: "下载",
  [EnumNodeType.Loop]: "循环",
  [EnumNodeType.InImgGp]: "图片组",
  [EnumNodeType.AudioPlayer]: "提示音",
  [EnumNodeType.Camera]: "视觉",
  [EnumNodeType.Python]: "Python",  
  [EnumNodeType.JavaScript]: "JavaScript",
  [EnumNodeType.Database]: "数据库",
  [EnumNodeType.OneWay]: "单向", // 添加标签
  [EnumNodeType.Named]: "命名", // 添加命名节点标签
  [EnumNodeType.ImageCrop]: "裁剪", // 添加图片裁剪节点标签
  [EnumNodeType.ScreenCapture]: "观察", // 添加屏幕观察节点标签
  [EnumNodeType.ImgCompress]: "压缩",
  [EnumNodeType.Resize]: "调尺寸", // 添加调整尺寸节点标签
  [EnumNodeType.CsvQuery]: "查表", // 添加CSV查询节点标签
  [EnumNodeType.TableIterator]: "遍历", // 添加表格遍历节点标签
  [EnumNodeType.CheckData]: "核对",
  [EnumNodeType.ImageEnhance]: "增强", // 添加图像增强节点标签
  [EnumNodeType.ImageFilter]: "过滤", // 添加图像过滤器节点标签
  [EnumNodeType.ImageRotate]: "旋转",
  [EnumNodeType.Img2Table]: "图片转表", // 添加图片转表格节点标签
  [EnumNodeType.ExcelSheetExtractor]: "输入表格", // 添加标签
  [EnumNodeType.TableIterator2]: "遍历2", // 添加标签
  [EnumNodeType.CsvDeleteRowCol]: "删除", // 添加标签
  [EnumNodeType.FileName]: "文件名", // 添加文件名节点标签
  [EnumNodeType.CsvExtractor]: "提取", // 添加标签
  [EnumNodeType.DbWriteCsv]: "", // 新增节点名称
  [EnumNodeType.DbListCsv]: "", // 新增节点名称
  [EnumNodeType.ConcatColumn]: "拼接列", // 新增拼接列节点标签
  [EnumNodeType.MergeCall]: "合并调用", // 新增合并调用节点标签
  [EnumNodeType.ImageComposite]: "合成", // 新增图片合成节点标签
  [EnumNodeType.LongCode]: "长编码", // 新增长编码提取节点标签
  [EnumNodeType.CsvJsonConverter]: "转换", // 新增CSV-JSON转换节点标签
  [EnumNodeType.TransposeTable]: "转置", // 新增表格转置节点标签
  [EnumNodeType.ImgToRow]: "图片转行", // 新增图片转行节点标签
  [EnumNodeType.ImgToColumn]: "图片转列", // 新增图片转列节点标签
  [EnumNodeType.AddIndexColumn]: "添加序号", // 新增添加序号列节点标签
  [EnumNodeType.Judge]: "判断", // 判断节点标签
  [EnumNodeType.AddHeader]: "添加表头", // 添加表头节点标签
  [EnumNodeType.DbWriteCloud]: "写记忆(云端)", // 云端写入节点标签
  [EnumNodeType.DbReadCloud]: "读记忆(云端)", // 云端读取节点标签
  [EnumNodeType.CsvSort]: "排序", // 添加表格排序节点标签
  [EnumNodeType.CsvDedup]: "去重",
  [EnumNodeType.TextReplace]: "替换文字", // 文本替换节点标签
  [EnumNodeType.Fapiao]: "发票识别",
}

// 暗黑模式颜色（按分组统一）
const RecordGroupColorDark: Record<string, string> = {
  输入: "#262626",
  图片: "#2a2a2a",
  AI: "#003a8c",
  表格: "#8B8000",
  功能: "#595959",
  透明: "transparent",
  输出: "#000000",
}

const RecordGroupTextColorDark: Record<string, string> = {
  输入: "#f0f0f0",
  图片: "#f0f0f0",
  AI: "#d6e4ff",
  表格: "#f0f0f0",
  功能: "#ffffff",
  透明: "#f0f0f0",
  输出: "#ffffff",
}

export const RecordNodeColorDark: Record<EnumNodeType | string, string> = Object.keys(
  RecordGroupNameOfNode
).reduce((acc, nodeType) => {
  const group = (RecordGroupNameOfNode as Record<string, string>)[nodeType]
  acc[nodeType] = RecordGroupColorDark[group] ?? "#262626"
  return acc
}, {} as Record<string, string>) as unknown as Record<EnumNodeType | string, string>

export const RecordNodeTextColorDark: Record<EnumNodeType | string, string> = Object.keys(
  RecordGroupNameOfNode
).reduce((acc, nodeType) => {
  const group = (RecordGroupNameOfNode as Record<string, string>)[nodeType]
  acc[nodeType] = RecordGroupTextColorDark[group] ?? "#f0f0f0"
  return acc
}, {} as Record<string, string>) as unknown as Record<EnumNodeType | string, string>
export const NodeTypes: Record<EnumNodeType, any> = {
  [EnumNodeType.Func010]: () => null,
  [EnumNodeType.Database]: () => null,
  [EnumNodeType.OneWay]: () => null,
  [EnumNodeType.Data]:Data1,
  [EnumNodeType.Time]:Time,
  [EnumNodeType.InImg]:InImg,
  [EnumNodeType.In]:In1,
  // [EnumNodeType.InImgOrig]:InImgOrig,   
  [EnumNodeType.Out]:Out,
  [EnumNodeType.Prompt]:Prompt1,
  [EnumNodeType.OCR]:OCR,
  [EnumNodeType.MdFromImg]:OCR2MD,
  [EnumNodeType.PromptImg]:PromptImg,
  [EnumNodeType.PromptImgConst]:PromptImgConst,
  [EnumNodeType.Concat]:Concat,
  [EnumNodeType.Http]:Http,
  [EnumNodeType.InFile]:InFile,
  [EnumNodeType.InFileGp]:FileGroup,
  [EnumNodeType.Search]:Search,
  [EnumNodeType.Wait]:Wait,
  [EnumNodeType.DbWrite]:DbWrite,
  [EnumNodeType.DbRead]:DbRead,
  [EnumNodeType.DbList]:DbList,
  [EnumNodeType.Display]:Display,
  [EnumNodeType.Download]:Download, 
  [EnumNodeType.Loop]:Loop,
  [EnumNodeType.InImgGp]:ImageGroup,
  [EnumNodeType.AudioPlayer]:AudioPlayer,
  [EnumNodeType.Camera]:Camera,
  [EnumNodeType.Python]: PythonExecutor, // 注册Python执行节点组件
  [EnumNodeType.JavaScript]: JavaScriptExecutor, // 注册JavaScript执行节点组件
  [EnumNodeType.Named]: Named, // 注册命名节点组件
  [EnumNodeType.ImageCrop]: ImageCrop, // 注册图片裁剪节点组件
  [EnumNodeType.ScreenCapture]: ScreenCapture, // 注册屏幕观察节点组件
  [EnumNodeType.ImgCompress]: ImgCompress,
  [EnumNodeType.Resize]: Resize, // 注册调整尺寸节点组件
  [EnumNodeType.CsvQuery]: CsvQuery, // 注册CSV查询节点组件
  [EnumNodeType.TableIterator]: TableIterator, // 注册表格遍历节点组件
  [EnumNodeType.CheckData]: CheckData, // 注册核对节点组件
  [EnumNodeType.ImageEnhance]: ImageEnhance, // 注册图像增强节点组件
  [EnumNodeType.ImageFilter]: ImageFilter, // 注册图像过滤器节点组件
  [EnumNodeType.ImageRotate]: ImageRotate,
  [EnumNodeType.Img2Table]: Img2Table, // 注册图片转表格节点组件
  [EnumNodeType.ExcelSheetExtractor]: ExcelSheetExtractor, // 注册Excel工作表提取节点组件
  [EnumNodeType.TableIterator2]: TableIterator2, // 注册表格遍历2.0节点组件
  [EnumNodeType.CsvDeleteRowCol]: CsvDeleteRowCol, // 注册CSV行列删除节点组件
  [EnumNodeType.FileName]: FileName, // 注册文件名节点组件
  [EnumNodeType.CsvExtractor]: CsvExtractor, // 注册CSV行列提取节点组件
  [EnumNodeType.DbWriteCsv]: DbWriteCsv, // 注册CSV写入节点组件
  [EnumNodeType.DbListCsv]: DbListCsv, // 注册CSV列表节点组件
  [EnumNodeType.ConcatColumn]: ConcatColumn, // 注册拼接列节点组件
  [EnumNodeType.MergeCall]: MergeCall, // 注册合并调用节点组件
  [EnumNodeType.ImageComposite]: ImageComposite, // 注册图片合成节点组件
  [EnumNodeType.LongCode]: LongCode, // 注册长编码提取节点组件
  [EnumNodeType.CsvJsonConverter]: CsvJsonConverter, // 注册CSV-JSON转换节点组件
  [EnumNodeType.TransposeTable]: TransposeTable, // 注册表格转置节点组件
  [EnumNodeType.ImgToRow]: ImgToRow, // 注册图片转表格行节点组件
  [EnumNodeType.ImgToColumn]: ImgToColumn, // 注册图片转表格列节点组件
  [EnumNodeType.AddIndexColumn]: AddIndexColumn, // 注册表格添加序号列节点组件
  [EnumNodeType.Judge]: Judge, // 注册判断节点组件
  [EnumNodeType.TextToRow]: TextToRow, // 注册文本转表格行节点组件
  [EnumNodeType.AddHeader]: AddHeader, // 注册添加表头节点组件
  [EnumNodeType.DbWriteCloud]: DbWriteCloud, // 注册云端写入节点组件
  [EnumNodeType.DbReadCloud]: DbReadCloud, // 注册云端读取节点组件
  [EnumNodeType.CsvSort]: CsvSort, // 注册CSV排序节点组件
  [EnumNodeType.CsvDedup]: CsvDedup,
  [EnumNodeType.TextReplace]: TextReplace, // 注册文本替换节点组件
  [EnumNodeType.Fapiao]: Fapiao,
}

// 添加 OSS STS Token 响应数据类型
export type DataGetOssStsToken = {
  success: boolean
  message?: string
  sts: {
    accessKeyId?: string
    accessKeySecret?: string
    securityToken?: string
    expiration?: string
    region?: string
    bucket?: string
    host?: string
    dir?: string
    policy: string
    signature: string
    credential: string
    date: string
  }
}


export const RecordIframe:Record<EnumNodeType,string>={
  [EnumNodeType.TextToRow]:"<iframe src=\"//player.bilibili.com/player.html?isOutside=true&aid=115382551584131&bvid=BV1hAWiz8Ejr&cid=33117504571&p=1\" scrolling=\"no\" border=\"0\" frameborder=\"no\" framespacing=\"0\" allowfullscreen=\"true\"></iframe>",
  [EnumNodeType.In]:"<iframe src=\"//player.bilibili.com/player.html?isOutside=true&aid=115217044412891&bvid=BV1f6pszrEGn&cid=32431866061&p=1\" scrolling=\"no\" border=\"0\" frameborder=\"no\" framespacing=\"0\" allowfullscreen=\"true\"></iframe>",
  [EnumNodeType.Out]:"",
  //拼接节点
  [EnumNodeType.Concat]:"<iframe src=\"//player.bilibili.com/player.html?isOutside=true&aid=114867021291443&bvid=BV1cigAzQEAd&cid=31178559063&p=1\" scrolling=\"no\" border=\"0\" frameborder=\"no\" framespacing=\"0\" allowfullscreen=\"true\"></iframe>",
  //常量
  [EnumNodeType.Data]:"<iframe src=\"//player.bilibili.com/player.html?isOutside=true&aid=114860377578587&bvid=BV1qduxzVERz&cid=31067343928&p=1\" scrolling=\"no\" border=\"0\" frameborder=\"no\" framespacing=\"0\" allowfullscreen=\"true\"></iframe>",
  //文字AI节点
  [EnumNodeType.Prompt]:"<iframe src=\"//player.bilibili.com/player.html?isOutside=true&aid=115184060340546&bvid=BV16fHhzfEoU&cid=32306758758&p=1\" scrolling=\"no\" border=\"0\" frameborder=\"no\" framespacing=\"0\" allowfullscreen=\"true\"></iframe>",
  //OCR节点
  [EnumNodeType.OCR]:"<iframe src=\"//player.bilibili.com/player.html?isOutside=true&aid=114849254215851&bvid=BV1ztuezeEbM&cid=31025531217&p=1\" scrolling=\"no\" border=\"0\" frameborder=\"no\" framespacing=\"0\" allowfullscreen=\"true\"></iframe>",
  //图片转MD节点
  [EnumNodeType.MdFromImg]:"<iframe src=\"//player.bilibili.com/player.html?isOutside=true&aid=115212799709816&bvid=BV1pSpyzTEaV&cid=32416792864&p=1\" scrolling=\"no\" border=\"0\" frameborder=\"no\" framespacing=\"0\" allowfullscreen=\"true\"></iframe>",
  //图片AI
  [EnumNodeType.PromptImg]:"",
  //图片常量
  [EnumNodeType.PromptImgConst]:"<iframe src=\"//player.bilibili.com/player.html?isOutside=true&aid=115211541418497&bvid=BV1wtpCzYEi9&cid=32410634842&p=1\" scrolling=\"no\" border=\"0\" frameborder=\"no\" framespacing=\"0\" allowfullscreen=\"true\"></iframe>",
  //输入图片
  [EnumNodeType.InImg]:"<iframe src=\"//player.bilibili.com/player.html?isOutside=true&aid=114854656477234&bvid=BV1BrukzoExJ&cid=31043881484&p=1\" scrolling=\"no\" border=\"0\" frameborder=\"no\" framespacing=\"0\" allowfullscreen=\"true\"></iframe>",
  //搜索引擎
  [EnumNodeType.Search]:"<iframe src=\"//player.bilibili.com/player.html?isOutside=true&aid=114890056405946&bvid=BV1YBgBzTEAy&cid=31183996277&p=1\" scrolling=\"no\" border=\"0\" frameborder=\"no\" framespacing=\"0\" allowfullscreen=\"true\"></iframe>",
  //输入文件
  [EnumNodeType.InFile]:"<iframe src=\"//player.bilibili.com/player.html?isOutside=true&aid=114861770019970&bvid=BV1rgutzQEDL&cid=31178752589&p=1\" scrolling=\"no\" border=\"0\" frameborder=\"no\" framespacing=\"0\" allowfullscreen=\"true\"></iframe>",
  //原始图片
  // [EnumNodeType.InImgOrig]:"",  
  //文件组
  [EnumNodeType.InFileGp]:"<iframe src=\"//player.bilibili.com/player.html?isOutside=true&aid=114866383822117&bvid=BV1GSgczNEkb&cid=31097881454&p=1\" scrolling=\"no\" border=\"0\" frameborder=\"no\" framespacing=\"0\" allowfullscreen=\"true\"></iframe>",
  [EnumNodeType.Func010]:"",
  //HTTP节点
  [EnumNodeType.Http]:"<iframe src=\"//player.bilibili.com/player.html?isOutside=true&aid=115269003515189&bvid=BV1NPnuzNEwh&cid=32642631258&p=1\" scrolling=\"no\" border=\"0\" frameborder=\"no\" framespacing=\"0\" allowfullscreen=\"true\"></iframe>",
  //等待节点
  [EnumNodeType.Wait]:"<iframe src=\"//player.bilibili.com/player.html?isOutside=true&aid=114867222680235&bvid=BV1EkgAzmE8d&cid=31101750909&p=1\" scrolling=\"no\" border=\"0\" frameborder=\"no\" framespacing=\"0\" allowfullscreen=\"true\"></iframe>",
  //写记忆节点
  [EnumNodeType.DbWrite]:"<iframe src=\"//player.bilibili.com/player.html?isOutside=true&aid=114856082609003&bvid=BV1UpuJzrEds&cid=31065378160&p=1\" scrolling=\"no\" border=\"0\" frameborder=\"no\" framespacing=\"0\" allowfullscreen=\"true\"></iframe>",
  //读记忆节点
  [EnumNodeType.DbRead]:"<iframe src=\"//player.bilibili.com/player.html?isOutside=true&aid=115218587852742&bvid=BV13ipxzPEC8&cid=32439861743&p=1\" scrolling=\"no\" border=\"0\" frameborder=\"no\" framespacing=\"0\" allowfullscreen=\"true\"></iframe>",
  //全部记忆节点
  [EnumNodeType.DbList]:"<iframe src=\"//player.bilibili.com/player.html?isOutside=true&aid=114856082609003&bvid=BV1UpuJzrEds&cid=31065378160&p=1\" scrolling=\"no\" border=\"0\" frameborder=\"no\" framespacing=\"0\" allowfullscreen=\"true\"></iframe>",
  //显示节点
  [EnumNodeType.Display]:"<iframe src=\"//player.bilibili.com/player.html?isOutside=true&aid=114935086454636&bvid=BV1cx8Xz3EVf&cid=31351898186&p=1\" scrolling=\"no\" border=\"0\" frameborder=\"no\" framespacing=\"0\" allowfullscreen=\"true\"></iframe>",
  //下载节点
  [EnumNodeType.Download]:"<iframe src=\"//player.bilibili.com/player.html?isOutside=true&aid=114865846885519&bvid=BV1bBgwzhET5&cid=31095717942&p=1\" scrolling=\"no\" border=\"0\" frameborder=\"no\" framespacing=\"0\" allowfullscreen=\"true\"></iframe>",
  //循环节点
  [EnumNodeType.Loop]:"<iframe src=\"//player.bilibili.com/player.html?isOutside=true&aid=115218017424883&bvid=BV1SHp4zaEBh&cid=32436653259&p=1\" scrolling=\"no\" border=\"0\" frameborder=\"no\" framespacing=\"0\" allowfullscreen=\"true\"></iframe>",
  //图片组节点
  [EnumNodeType.InImgGp]:"<iframe src=\"//player.bilibili.com/player.html?isOutside=true&aid=114860981492808&bvid=BV1asuxzeEUu&cid=31180130550&p=1\" scrolling=\"no\" border=\"0\" frameborder=\"no\" framespacing=\"0\" allowfullscreen=\"true\"></iframe>",
  //提示音节点
  [EnumNodeType.AudioPlayer]:"<iframe src=\"//player.bilibili.com/player.html?isOutside=true&aid=114866182493414&bvid=BV1PTgwzXEe3&cid=31096964829&p=1\" scrolling=\"no\" border=\"0\" frameborder=\"no\" framespacing=\"0\" allowfullscreen=\"true\"></iframe>",
  //视觉节点
  [EnumNodeType.Camera]:"<iframe src=\"//player.bilibili.com/player.html?isOutside=true&aid=115223839120192&bvid=BV1W4pezGEv3&cid=32460047784&p=1\" scrolling=\"no\" border=\"0\" frameborder=\"no\" framespacing=\"0\" allowfullscreen=\"true\"></iframe>",
  //Python节点
  [EnumNodeType.Python]:"<iframe src=\"//player.bilibili.com/player.html?isOutside=true&aid=115133040826986&bvid=BV1GMaAz4EHL&cid=32106743799&p=1\" scrolling=\"no\" border=\"0\" frameborder=\"no\" framespacing=\"0\" allowfullscreen=\"true\"></iframe>",
  //JavaScript节点
  [EnumNodeType.JavaScript]:"",
  //数据库节点
  [EnumNodeType.Database]:"",
  //单向节点
  [EnumNodeType.OneWay]:"",
  //命名节点
  [EnumNodeType.Named]:"<iframe src=\"//player.bilibili.com/player.html?isOutside=true&aid=114867574935575&bvid=BV1x1gwzdEbF&cid=31177245572&p=1\" scrolling=\"no\" border=\"0\" frameborder=\"no\" framespacing=\"0\" allowfullscreen=\"true\"></iframe>",
  //图片裁剪节点
  [EnumNodeType.ImageCrop]:"<iframe src=\"//player.bilibili.com/player.html?isOutside=true&aid=114890324841223&bvid=BV1yVgBzWEvn&cid=31185437652&p=1\" scrolling=\"no\" border=\"0\" frameborder=\"no\" framespacing=\"0\" allowfullscreen=\"true\"></iframe>",
  //屏幕观察节点
  [EnumNodeType.ScreenCapture]:"<iframe src=\"//player.bilibili.com/player.html?isOutside=true&aid=114855176573688&bvid=BV1tgu1z1ErT&cid=31046175505&p=1\" scrolling=\"no\" border=\"0\" frameborder=\"no\" framespacing=\"0\" allowfullscreen=\"true\"></iframe>",
  //调整尺寸节点
  [EnumNodeType.Resize]:"<iframe src=\"//player.bilibili.com/player.html?isOutside=true&aid=114894653362971&bvid=BV1VBg7z2EkC&cid=31199527304&p=1\" scrolling=\"no\" border=\"0\" frameborder=\"no\" framespacing=\"0\" allowfullscreen=\"true\"></iframe>",
  //CSV查询节点
  [EnumNodeType.CsvQuery]:"<iframe src=\"//player.bilibili.com/player.html?isOutside=true&aid=114901431361168&bvid=BV14Z8FzBEVk&cid=31226595150&p=1\" scrolling=\"no\" border=\"0\" frameborder=\"no\" framespacing=\"0\" allowfullscreen=\"true\"></iframe>",
  //表格遍历节点
  [EnumNodeType.TableIterator]:"<iframe src=\"//player.bilibili.com/player.html?isOutside=true&aid=114905843834034&bvid=BV18y8TzhE5k&cid=31325752288&p=1\" scrolling=\"no\" border=\"0\" frameborder=\"no\" framespacing=\"0\" allowfullscreen=\"true\"></iframe>",
  //核对数据节点
  [EnumNodeType.CheckData]:"",
  //图片转表格节点
  [EnumNodeType.Img2Table]:"<iframe src=\"//player.bilibili.com/player.html?isOutside=true&aid=115212363503893&bvid=BV1bhpkzrE8G&cid=32414827254&p=1\" scrolling=\"no\" border=\"0\" frameborder=\"no\" framespacing=\"0\" allowfullscreen=\"true\"></iframe>",
  //Excel工作表提取节点
  [EnumNodeType.ExcelSheetExtractor]:"<iframe src=\"//player.bilibili.com/player.html?isOutside=true&aid=114906196086901&bvid=BV1xG8TzpE2r&cid=31243242474&p=1\" scrolling=\"no\" border=\"0\" frameborder=\"no\" framespacing=\"0\" allowfullscreen=\"true\"></iframe>",
  //表格遍历2.0节点
  [EnumNodeType.TableIterator2]:"<iframe src=\"//player.bilibili.com/player.html?isOutside=true&aid=115228788399865&bvid=BV13oWgztEiF&cid=32478793647&p=1\" scrolling=\"no\" border=\"0\" frameborder=\"no\" framespacing=\"0\" allowfullscreen=\"true\"></iframe>",
  //CSV行列删除节点
  [EnumNodeType.CsvDeleteRowCol]:"<iframe src=\"//player.bilibili.com/player.html?isOutside=true&aid=114906800067601&bvid=BV1bu8uzAE9C&cid=31245928130&p=1\" scrolling=\"no\" border=\"0\" frameborder=\"no\" framespacing=\"0\" allowfullscreen=\"true\"></iframe>",
  //文件名节点
  [EnumNodeType.FileName]:"<iframe src=\"//player.bilibili.com/player.html?isOutside=true&aid=114889871859473&bvid=BV1aigBzBE95&cid=31183011958&p=1\" scrolling=\"no\" border=\"0\" frameborder=\"no\" framespacing=\"0\" allowfullscreen=\"true\"></iframe>",
  [EnumNodeType.CsvExtractor]:"<iframe src=\"//player.bilibili.com/player.html?isOutside=true&aid=114907034947676&bvid=BV1Cr8MzHETc&cid=31247173539&p=1\" scrolling=\"no\" border=\"0\" frameborder=\"no\" framespacing=\"0\" allowfullscreen=\"true\"></iframe>",
  //写记忆(表格)
  [EnumNodeType.DbWriteCsv]:"<iframe src=\"//player.bilibili.com/player.html?isOutside=true&aid=114934163707701&bvid=BV1PL8DzgE7q&cid=31347183478&p=1\" scrolling=\"no\" border=\"0\" frameborder=\"no\" framespacing=\"0\" allowfullscreen=\"true\"></iframe>",
  //全部记忆(表格)
  [EnumNodeType.DbListCsv]:"<iframe src=\"//player.bilibili.com/player.html?isOutside=true&aid=114934163707701&bvid=BV1PL8DzgE7q&cid=31347183478&p=1\" scrolling=\"no\" border=\"0\" frameborder=\"no\" framespacing=\"0\" allowfullscreen=\"true\"></iframe>",
  //拼接列节点
  [EnumNodeType.ConcatColumn]:"<iframe src=\"//player.bilibili.com/player.html?isOutside=true&aid=114929801633663&bvid=BV1zA87zuEvY&cid=31331780718&p=1\" scrolling=\"no\" border=\"0\" frameborder=\"no\" framespacing=\"0\" allowfullscreen=\"true\"></iframe>",
  [EnumNodeType.MergeCall]:"",
  [EnumNodeType.LongCode]:"",
  //CSV-JSON转换节点
  [EnumNodeType.CsvJsonConverter]:"<iframe src=\"//player.bilibili.com/player.html?isOutside=true&aid=114933811385402&bvid=BV1zK8QzNEHa&cid=31345806094&p=1\" scrolling=\"no\" border=\"0\" frameborder=\"no\" framespacing=\"0\" allowfullscreen=\"true\"></iframe>",
  //表格转置节点
  [EnumNodeType.TransposeTable]:"<iframe src=\"//player.bilibili.com/player.html?isOutside=true&aid=114934482671395&bvid=BV12d8XzDEJm&cid=31348885111&p=1\" scrolling=\"no\" border=\"0\" frameborder=\"no\" framespacing=\"0\" allowfullscreen=\"true\"></iframe>",
  //图片转表格行节点
  [EnumNodeType.ImgToRow]:"<iframe src=\"//player.bilibili.com/player.html?isOutside=true&aid=114849237442379&bvid=BV1B8uezAENE&cid=31025463967&p=1\" scrolling=\"no\" border=\"0\" frameborder=\"no\" framespacing=\"0\" allowfullscreen=\"true\"></iframe>",
  [EnumNodeType.ImgToColumn]:"",
  //表格添加序号列节点
  [EnumNodeType.AddIndexColumn]:"<iframe src=\"//player.bilibili.com/player.html?isOutside=true&aid=115229425932873&bvid=BV1RtWuztEvv&cid=32481873442&p=1\" scrolling=\"no\" border=\"0\" frameborder=\"no\" framespacing=\"0\" allowfullscreen=\"true\"></iframe>",
  //判断节点
  [EnumNodeType.Judge]:"<iframe src=\"//player.bilibili.com/player.html?isOutside=true&aid=115127386906204&bvid=BV1iUaEz5EmL&cid=32086166312&p=1\" scrolling=\"no\" border=\"0\" frameborder=\"no\" framespacing=\"0\" allowfullscreen=\"true\"></iframe>",
  //图片合成节点
  [EnumNodeType.ImageComposite]:"<iframe src=\"//player.bilibili.com/player.html?isOutside=true&aid=115224141110046&bvid=BV1eNpez4EzN&cid=32461816485&p=1\" scrolling=\"no\" border=\"0\" frameborder=\"no\" framespacing=\"0\" allowfullscreen=\"true\"></iframe>",
  //图片压缩节点
  [EnumNodeType.ImgCompress]:"<iframe src=\"//player.bilibili.com/player.html?isOutside=true&aid=114894401705083&bvid=BV1jhg7zHE1Y&cid=31198283709&p=1\" scrolling=\"no\" border=\"0\" frameborder=\"no\" framespacing=\"0\" allowfullscreen=\"true\"></iframe>",
  //图片增强节点
  [EnumNodeType.ImageEnhance]:"<iframe src=\"//player.bilibili.com/player.html?isOutside=true&aid=114894854692289&bvid=BV12ignzyE7P&cid=31200575704&p=1\" scrolling=\"no\" border=\"0\" frameborder=\"no\" framespacing=\"0\" allowfullscreen=\"true\"></iframe>",
  //图片过滤器节点
  [EnumNodeType.ImageFilter]:"<iframe src=\"//player.bilibili.com/player.html?isOutside=true&aid=114895542558064&bvid=BV1aAgJzEEMa&cid=31203656001&p=1\" scrolling=\"no\" border=\"0\" frameborder=\"no\" framespacing=\"0\" allowfullscreen=\"true\"></iframe>",
  //图片旋转节点
  [EnumNodeType.ImageRotate]:"<iframe src=\"//player.bilibili.com/player.html?isOutside=true&aid=114895274122268&bvid=BV1JtgJzwEvT&cid=31202280602&p=1\" scrolling=\"no\" border=\"0\" frameborder=\"no\" framespacing=\"0\" allowfullscreen=\"true\"></iframe>",
  //图片裁剪节点
  [EnumNodeType.AddHeader]:"<iframe src=\"//player.bilibili.com/player.html?isOutside=true&aid=115387282758660&bvid=BV1UqWrzrE62&cid=33140967571&p=1\" scrolling=\"no\" border=\"0\" frameborder=\"no\" framespacing=\"0\" allowfullscreen=\"true\"></iframe>",
  //时间节点
  [EnumNodeType.Time]:"",
  //云端写入节点
  [EnumNodeType.DbWriteCloud]:"",
  [EnumNodeType.DbReadCloud]:"", // 云端读取节点图标
  //排序
  [EnumNodeType.CsvSort]:"",
  [EnumNodeType.CsvDedup]:"",
  [EnumNodeType.TextReplace]:"",
  [EnumNodeType.Fapiao]:"",
}


export type DataInviteCreateLink={
  success:boolean,
  message:string,
  link:string
}

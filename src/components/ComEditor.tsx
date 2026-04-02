import { Modal, QRCode } from "antd";
import { useState } from "react";
import { Dropdown, Flex } from "antd";
import { ColorImgProcess, ColorTable, RecordNodeColor, RecordNodeColorDark, RecordNodeLabel, RecordNodeTextColor, RecordNodeTextColorDark } from "../common/types/types";
import { useTheme } from "../common/theme/themeContext";
import { EnumNodeType } from "../common/types/types";
import { useCallback } from "react";
import { Tooltip } from "antd";
import { Button } from "antd";

function ToolBox({count,countinputtext,countinputimg,addNode}:
  {count:number,countinputtext:number,countinputimg:number,addNode:(arg:EnumNodeType)=>void}) {
  const {theme}=useTheme()

  const groupButtonStyle = useCallback((group: "ai" | "image" | "table") => {
    if (group === "ai") {
      return {
        backgroundColor: theme === "dark" ? "#003a8c" : "lightblue",
        borderColor: "var(--border-color)",
        color: theme === "dark" ? "#d6e4ff" : "#000",
      } as const;
    }

    if (group === "image") {
      return {
        backgroundColor: theme === "dark" ? "#d48806" : ColorImgProcess,
        borderColor: "var(--border-color)",
        color: "#000",
      } as const;
    }

    return {
      backgroundColor: theme === "dark" ? "#8B8000" : ColorTable,
      borderColor: "var(--border-color)",
      color: theme === "dark" ? "#f0f0f0" : "#000",
    } as const;
  }, [theme]);
  
  // 按功能分组的节点类型
  const nodeGroups = {
    input: [
      {nodeType: EnumNodeType.Data, name: RecordNodeLabel[EnumNodeType.Data], 
        desc: "用于输入固定不变的数据" },
      {nodeType: EnumNodeType.In, name: RecordNodeLabel[EnumNodeType.In], 
        desc: "用于输入文字内容" },
      {nodeType: EnumNodeType.InImg, name: RecordNodeLabel[EnumNodeType.InImg], 
        desc: "支持图片上传和抽样压缩" },
      {nodeType: EnumNodeType.InImgGp, name: RecordNodeLabel[EnumNodeType.InImgGp], 
        desc: "支持多图片批量上传，支持PDF转图片" },
      // {nodeType: EnumNodeType.InImgOrig, name: RecordNodeLabel[EnumNodeType.InImgOrig], 
      //   desc: "保持原始尺寸的图片压缩处理" },
      // {nodeType: EnumNodeType.InFile, name: RecordNodeLabel[EnumNodeType.InFile], 
      //   desc: "用于上传文件" },
      {nodeType: EnumNodeType.InFileGp, name: RecordNodeLabel[EnumNodeType.InFileGp], 
        desc: "支持多文件批量上传和管理" },
      {nodeType: EnumNodeType.DbRead, name: RecordNodeLabel[EnumNodeType.DbRead], 
        desc: "从记忆中读取最新一条信息" },
      {nodeType: EnumNodeType.DbReadCloud, name: RecordNodeLabel[EnumNodeType.DbReadCloud],
        desc: "从云端记忆中读取全部信息" },
      {nodeType: EnumNodeType.DbList, name: RecordNodeLabel[EnumNodeType.DbList], 
        desc: "从记忆中读取全部信息" },
      {nodeType: EnumNodeType.Camera, name: RecordNodeLabel[EnumNodeType.Camera],
        desc: "为应用提供视觉能力" },
      {nodeType: EnumNodeType.ScreenCapture, name: RecordNodeLabel[EnumNodeType.ScreenCapture], 
        desc: "观察屏幕画面，然后可以将其传递给AI进行处理" },
      {nodeType: EnumNodeType.Time, name: RecordNodeLabel[EnumNodeType.Time], 
        desc: "获取当前时间" },
    ],
    image: [
      {nodeType: EnumNodeType.ImageCrop, name: RecordNodeLabel[EnumNodeType.ImageCrop], 
        desc: "根据指定的边界百分比裁剪图片" },
      {nodeType: EnumNodeType.ImgCompress, name: RecordNodeLabel[EnumNodeType.ImgCompress], 
        desc: "对图片进行压缩处理，可调整采样比例" },
      {nodeType: EnumNodeType.Resize, name: RecordNodeLabel[EnumNodeType.Resize], 
        desc: "调整图片尺寸，修改图片分辨率" },
      {nodeType: EnumNodeType.ImageEnhance, name: RecordNodeLabel[EnumNodeType.ImageEnhance], 
        desc: "增强图像亮度、对比度、饱和度和锐度" },
      {nodeType: EnumNodeType.ImageFilter, name: RecordNodeLabel[EnumNodeType.ImageFilter], 
        desc: "图像灰度化、二值化、边缘检测等处理" },
      {nodeType: EnumNodeType.ImageRotate, name: RecordNodeLabel[EnumNodeType.ImageRotate], 
        desc: "支持任意角度旋转图片" },
      {nodeType: EnumNodeType.ImageComposite, name: RecordNodeLabel[EnumNodeType.ImageComposite], 
        desc: "将两张图片合成为一张图片，支持透明度调整" },
    ],
    ai: [
      {nodeType: EnumNodeType.OCR, name: RecordNodeLabel[EnumNodeType.OCR], 
        desc: "提取图片中的全部文字" },
      {nodeType: EnumNodeType.ImgToRow, name: RecordNodeLabel[EnumNodeType.ImgToRow], 
        desc: "提取图片中的指定信息并自动转换为表格的一行或多行" },
      {nodeType: EnumNodeType.PromptImgConst, name: RecordNodeLabel[EnumNodeType.PromptImgConst], 
        desc: "提取图片中的物体和文字(更智能)" },
      // {nodeType: EnumNodeType.ImgToColumn, name: RecordNodeLabel[EnumNodeType.ImgToColumn], 
      //   desc: "提取图片中的数据并自动转换为表格的一列或多列" },
      {nodeType: EnumNodeType.Img2Table, name: RecordNodeLabel[EnumNodeType.Img2Table], 
        desc: "将表格图片转换为表格内容，配合下载节点可以直接得到表格文件" },
      // {nodeType: EnumNodeType.MdFromImg, name: RecordNodeLabel[EnumNodeType.MdFromImg], 
      //   desc: "识别图片中的文字并转换为Markdown格式" },
      {nodeType: EnumNodeType.Prompt, name: RecordNodeLabel[EnumNodeType.Prompt], 
        desc: "使用大模型分析文本" },
      {nodeType: EnumNodeType.TextToRow, name: RecordNodeLabel[EnumNodeType.TextToRow], 
        desc: "从输入的文本中提取指定信息，并自动转为表格的一行" },
      {nodeType: EnumNodeType.Fapiao, name: RecordNodeLabel[EnumNodeType.Fapiao], 
        desc: "专用于识别发票图片(消耗2.5资源点)）" },
      {nodeType: EnumNodeType.Search, name: RecordNodeLabel[EnumNodeType.Search], 
        desc: "提供联网搜索能力" },
      // {nodeType: EnumNodeType.LongCode, name: RecordNodeLabel[EnumNodeType.LongCode], 
      //   desc: "提取图片中的长编码" },
    ],
    // 新增表格组
    table: [
      {
        nodeType: EnumNodeType.ExcelSheetExtractor,
        name: RecordNodeLabel[EnumNodeType.ExcelSheetExtractor],
        desc: "从Excel文件中提取指定工作表并输出表格文本"
      },
      {
        nodeType: EnumNodeType.CsvQuery,
        name: RecordNodeLabel[EnumNodeType.CsvQuery],
        desc: "查询满足指定条件的行"
      },
      {
        nodeType: EnumNodeType.TableIterator, 
        name: RecordNodeLabel[EnumNodeType.TableIterator],
        desc: "根据序号遍历表格行，支持CSV与Excel"
      },
      {
        nodeType: EnumNodeType.TableIterator2,
        name: RecordNodeLabel[EnumNodeType.TableIterator2],
        desc: "从上游接收表格数据和行号，支持更灵活的表格遍历"
      },
      {
        nodeType: EnumNodeType.CheckData,
        name: RecordNodeLabel[EnumNodeType.CheckData],
        desc: "比较表格数据与其他表的一行数据，输出不匹配的项"
      },
      {
        nodeType: EnumNodeType.CsvDeleteRowCol,
        name: RecordNodeLabel[EnumNodeType.CsvDeleteRowCol],
        desc: "删除表格中的指定行或列"
      },
      {
        nodeType: EnumNodeType.CsvExtractor,
        name: RecordNodeLabel[EnumNodeType.CsvExtractor],
        desc: "从表格中提取指定的行或列"
      },
      {
        nodeType: EnumNodeType.ConcatColumn,
        name: RecordNodeLabel[EnumNodeType.ConcatColumn],
        desc: "将列或字符串拼接为表格中的新列"
      },
      {
        nodeType: EnumNodeType.CsvJsonConverter,
        name: RecordNodeLabel[EnumNodeType.CsvJsonConverter],
        desc: "在表格和AI格式之间相互转换"
      },
      // {nodeType: EnumNodeType.DbWriteCsv, name: RecordNodeLabel[EnumNodeType.DbWriteCsv], 
      //   desc: "将表格内容存入到记忆中" },
      // {nodeType: EnumNodeType.DbListCsv, name: RecordNodeLabel[EnumNodeType.DbListCsv],
      //   desc: "获取记忆中全部的表格内容" },
      {
        nodeType: EnumNodeType.TransposeTable,
        name: RecordNodeLabel[EnumNodeType.TransposeTable],
        desc: "将表格的行列互换，行变为列、列变为行"
      },
      {
        nodeType: EnumNodeType.CsvSort,
        name: RecordNodeLabel[EnumNodeType.CsvSort],
        desc: "根据指定列对表格进行排序，支持升序和降序"
      },
      // {
      //   nodeType: EnumNodeType.CsvDedup,
      //   name: RecordNodeLabel[EnumNodeType.CsvDedup],
      //   desc: "按指定表头字段去重，移除重复行(保留第一条)"
      // },
      {
        nodeType: EnumNodeType.AddIndexColumn,
        name: RecordNodeLabel[EnumNodeType.AddIndexColumn],
        desc: "为表格添加序号列，可配置序号起始值和插入位置"
      },
      {
        nodeType: EnumNodeType.AddHeader,
        name: RecordNodeLabel[EnumNodeType.AddHeader],
        desc: "为表格添加表头"
      },
    ],
    
    function: [
      {nodeType: EnumNodeType.Display, name: RecordNodeLabel[EnumNodeType.Display], 
        desc: "用于显示图片或图片链接，还提供图片压缩功能" },
      {nodeType: EnumNodeType.Http, name: RecordNodeLabel[EnumNodeType.Http], 
        desc: "发送HTTP请求" },
      {nodeType: EnumNodeType.Loop, name: RecordNodeLabel[EnumNodeType.Loop], 
        desc: "循环运行指定次数" },
      {nodeType: EnumNodeType.Concat, name: RecordNodeLabel[EnumNodeType.Concat], 
        desc: "连接多个输入" },
      {
        nodeType: EnumNodeType.Named,
        name: RecordNodeLabel[EnumNodeType.Named],
        desc: "给文件命名"
      },
      {
        nodeType: EnumNodeType.FileName,
        name: RecordNodeLabel[EnumNodeType.FileName],
        desc: "获取文件名"
      },
      {
        nodeType: EnumNodeType.Judge,
        name: RecordNodeLabel[EnumNodeType.Judge],
        desc: "根据条件判断值是否满足，支持多种比较方式"
      },
      // {
      //   nodeType: EnumNodeType.Python,
      //   name: RecordNodeLabel[EnumNodeType.Python],
      //   desc: "使用Python的强大能力"
      // },
      {
        nodeType: EnumNodeType.JavaScript,
        name: RecordNodeLabel[EnumNodeType.JavaScript],
        desc: "使用JavaScript的强大能力"
      }
    ],
    
    transparent: [
      {
        nodeType: EnumNodeType.AudioPlayer, 
        name: RecordNodeLabel[EnumNodeType.AudioPlayer], 
        desc: "播放音频文件" 
      },
      {nodeType: EnumNodeType.Download, name: RecordNodeLabel[EnumNodeType.Download], 
        desc: "将上游输入保存为文件" },
      {nodeType: EnumNodeType.Wait, name: RecordNodeLabel[EnumNodeType.Wait], 
        desc: "延迟执行" },
      {nodeType: EnumNodeType.DbWrite, name: RecordNodeLabel[EnumNodeType.DbWrite], 
        desc: "将数据存入本地记忆" },
      {nodeType: EnumNodeType.DbWriteCloud, name: RecordNodeLabel[EnumNodeType.DbWriteCloud], 
        desc: "将信息写入到云端记忆" },
    ],
    output: [
      {nodeType: EnumNodeType.Out, name: RecordNodeLabel[EnumNodeType.Out], 
        desc: "输出最终结果" },
    ]
  };

  const checkDisable = useCallback((type: EnumNodeType) => {
    void type
    // switch (type) {
    //   case EnumNodeType.In:
    //     return countinputtext >= 1;
    //   case EnumNodeType.InImg:
    //     return countinputimg >= 1;
    //   case EnumNodeType.Out:
    //     return count >= 1
    //   default:
    //     return false
    // }
    return false
  }, [count, countinputtext, countinputimg]);

  // 创建下拉菜单项，修改Tooltip实现方式
  const createMenuItems = (nodes: {nodeType: EnumNodeType, name: string, desc: string}[]) => {
    return nodes.map((node, index) => ({
      key: index.toString(),
      label: (
        <div>
          {/* 使用overlay属性替代直接传入内容，减少可能触发findDOMNode的情况 */}
          <Tooltip 
            title={node.desc}
            placement="right"
            mouseEnterDelay={0.5}
            destroyTooltipOnHide={true}
          >
            <Button 
              style={{
                width: '100%',
                color: checkDisable(node.nodeType) ? undefined : 
                  (theme === "dark" ? RecordNodeTextColorDark[node.nodeType] : RecordNodeTextColor[node.nodeType]),
                backgroundColor: theme === "dark" ? RecordNodeColorDark[node.nodeType] : RecordNodeColor[node.nodeType]
              }} 
              disabled={checkDisable(node.nodeType)}
              onClick={() => addNode(node.nodeType)}
            >
              {RecordNodeLabel[node.nodeType]}
            </Button>
          </Tooltip>
        </div>
      )
    }));
  };

  return (
    <Flex justify='center' style={{width:"100%"}}>
      <Flex gap="small" wrap style={{
        padding: 6,
        top: "0px", 
        zIndex: "100",
        borderRadius: "6px",
        backgroundColor: "var(--debug-panel-bg)",
        border: "1px solid var(--border-color)",
        boxShadow: "0 2px 8px var(--shadow-color)",
        backdropFilter: "blur(6px)"
      }}>
        {/* 修改顶层Tooltip实现 */}
        <Tooltip title="添加输入类节点" mouseEnterDelay={0.5} destroyTooltipOnHide={true}>
          <Dropdown 
            menu={{ items: createMenuItems(nodeGroups.input) }}
            trigger={['click']}
          >
            <Button>输入</Button>
          </Dropdown>
        </Tooltip>
        
        <Tooltip title="添加AI处理节点" mouseEnterDelay={0.5} destroyTooltipOnHide={true}>
          <Dropdown 
            menu={{ items: createMenuItems(nodeGroups.ai) }}
            trigger={['click']}
          >
            <Button style={groupButtonStyle("ai")}>AI</Button>
          </Dropdown>
        </Tooltip>
        
        <Tooltip title="添加图片处理节点" mouseEnterDelay={0.5} destroyTooltipOnHide={true}>
          <Dropdown 
            menu={{ items: createMenuItems(nodeGroups.image) }}
            trigger={['click']}
          >
            <Button style={groupButtonStyle("image")}>图片</Button>
          </Dropdown>
        </Tooltip>
        
        {/* 添加表格处理下拉菜单 */}
        <Tooltip title="添加表格处理节点" mouseEnterDelay={0.5} destroyTooltipOnHide={true}>
          <Dropdown 
            menu={{ items: createMenuItems(nodeGroups.table) }}
            trigger={['click']}
          >
            <Button style={groupButtonStyle("table")}>表格</Button>
          </Dropdown>
        </Tooltip>
        <Tooltip title="添加功能节点" mouseEnterDelay={0.5} destroyTooltipOnHide={true}>
          <Dropdown 
            menu={{ items: createMenuItems(nodeGroups.function) }}
            trigger={['click']}
          >
            <Button>功能</Button>
          </Dropdown>
        </Tooltip>
        <Tooltip title="添加无处理类节点(输出等于输入)" mouseEnterDelay={0.5} destroyTooltipOnHide={true}>
          <Dropdown
            menu={{ items: createMenuItems(nodeGroups.transparent) }}
            trigger={['click']}
          >
            <Button>透明</Button>
          </Dropdown>
        </Tooltip>
        
        <Tooltip title="添加输出节点" mouseEnterDelay={0.5} destroyTooltipOnHide={true}>
          <Dropdown 
            menu={{ items: createMenuItems(nodeGroups.output) }}
            trigger={['click']}
          >
            <Button>输出</Button>
          </Dropdown>
        </Tooltip>
      </Flex>
    </Flex>
  )
}
function QR({url}:{url:string}) {
  const [show,SetShow]=useState(false)
  function hide() {
    SetShow(false)
  }
  return(
    <>
      <Button onClick={()=>{
        SetShow(true)
      }}>展码</Button>
      <Modal footer={null} onClose={hide} onOk={hide} onCancel={hide} open={show}>
        <Flex justify='center' align='center'>
          <QRCode value={url}></QRCode>
        </Flex>
      </Modal>
    </>
  )
}

export {
  ToolBox,
  QR
}
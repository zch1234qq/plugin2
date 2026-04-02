// import { Handle, Position } from "@xyflow/react";
// import Shell from "./shell1";
// import { useEffect, useRef, useState } from "react";
// import { NodeData, Res } from "../../common/types";
// import { Input, Select, Space, Modal, message, Alert } from "antd";
// import { dbManager, isTauriEnv } from '../../utils/dbUtils';

// /**
//  * 解析数据库操作参数
//  * @param input 输入路径，格式如 "/value1/value2/value3"
//  */
// function parseDbOperation(input: string): Record<string, string> {
//   try {
//     const values = input.split('/').filter(Boolean);
//     return values.reduce((obj: Record<string, string>, value, index) => {
//       obj[(index + 1).toString()] = value;
//       return obj;
//     }, {});
//   } catch (error: any) {
//     throw new Error(`解析参数失败: ${error.message}`);
//   }
// }

// /**
//  * 数据库节点组件
//  * 用于配置和连接数据库
//  * @param {Object} props - 组件属性
//  * @param {string} props.id - 节点ID
//  * @param {NodeData} props.data - 节点数据
//  * @returns {JSX.Element} 数据库节点组件
//  */
// export default function Database({id, data}: {id: string, data: NodeData}) {
//   const [v0,setV0] = useState("");
//   const [v1,setV1] = useState("");
//   const v0Ref = useRef(v0);
//   const v1Ref = useRef(v1);
//   // 数据库连接配置状态
//   const [dbType, setDbType] = useState("mongodb"); // 数据库类型
//   const [host, setHost] = useState("db");
//   const [port, setPort] = useState("27017");
//   const [username, setUsername] = useState("");
//   const [password, setPassword] = useState("");
//   const [database, setDatabase] = useState("");
//   const [isConnected, setIsConnected] = useState(false);
//   const [updateFlag,] = useState(false);
//   const [isModalOpen, setIsModalOpen] = useState(false);

//   // 创建refs用于在异步操作中访问最新值
//   const configRef = useRef({
//     dbType,
//     host,
//     port,
//     username,
//     password,
//     database
//   });

//   useEffect(() => {
//     return () => {
//       handleDisconnect();
//     }
//   }, []);

//   // 更新ref当配置改变时
//   useEffect(() => {
//     configRef.current = {
//       dbType,
//       host, 
//       port,
//       username,
//       password,
//       database
//     };
//   }, [dbType, host, port, username, password, database]);

//   // 数据库类型选项
//   const dbTypeOptions = [
//     { value: 'mysql', label: 'MySQL' },
//     { value: 'mongodb', label: 'MongoDB' },
//   ];

//   /**
//    * 处理数据库连接
//    */
//   const handleConnect = async () => {
//     try {
//       const result = await dbManager.connect(
//         host,        // 例如: "localhost" 或 具体IP
//         port,        // 例如: "27017"
//         username,    // MongoDB 用户名
//         password,    // MongoDB 密码
//         database     // 数据库名称
//       );

//       if (result.success) {
//         setIsConnected(true);
//         message.success('数据库连接成功');
//       } else {
//         message.error(result.message);
//       }
//     } catch (error: any) {
//       message.error(`连接失败: ${error.message}`);
//     }
//   };

//   /**
//    * 处理数据库断开连接
//    */
//   const handleDisconnect = async () => {
//     try {
//       const response = await dbManager.disconnect();

//       if (response.success) {
//         message.success(response.message);
//         setIsConnected(false);
//       } else {
//         message.error(response.message);
//       }
//     } catch (error: any) {
//       message.error(`断开连接失败: ${error.message}`);
//     }
//   };

//   const runs:Record<string, (input: Res) => Promise<Res>> = {
//     "0": run
//   }

//   async function run(input: Res): Promise<Res> {
//     v0Ref.current = v0;
//     v1Ref.current = v1;
//     try {
//       if (!isConnected) {
//         await handleConnect();
//         return {
//           success: false,
//           msg: "请先连接数据库"
//         };
//       }

//       if (!input.msg || typeof input.msg !== 'string') {
//         return { success: false, msg: "输入格式错误" };
//       }
//       input.msg = "/张春辉/30/175"
//       const data = parseDbOperation(input.msg);
//       // 构造查询对象，添加 upsert 选项
//       const query = {
//         filter: { "1": data["1"] },     // 查询条件
//         update: { $set: data },          // 更新操作
//         $upsert: true                    // 不存在则插入
//       };

//       await dbManager.updateOne(
//         configRef.current.database,
//         'defaultCollection',
//         query
//       );

//       return input
//     } catch (error: any) {
//       return {
//         success: false,
//         msg: error.message
//       };
//     }
//   }

//   /**
//    * 显示配置Modal
//    */
//   const showModal = () => {
//     setIsModalOpen(true);
//   };

//   /**
//    * 处理Modal确认
//    */
//   const handleOk = () => {
//     setIsModalOpen(false);
//     if (!isConnected) {
//       handleConnect();
//     }
//   };

//   /**
//    * 处理Modal取消
//    */
//   const handleCancel = () => {
//     setIsModalOpen(false);
//   };

//   return (
//     <div>
//       {isTauriEnv ? (
//         <Shell onDoubleClick={showModal} data={data} updateFlag={updateFlag} id={id} runs={runs}>
//           <Input style={{width: '50%'}} value={v0} onChange={(e) => setV0(e.target.value)}/>
//           <Input style={{width: '50%'}} value={v1} onChange={(e) => setV1(e.target.value)}/>
//           <Modal
//             title="数据库连接配置"
//             open={isModalOpen}
//             onOk={handleOk}
//             onCancel={handleCancel}
//           >
//             <Space direction="vertical" style={{ width: '100%' }}>
//               <Select
//                 value={dbType}
//                 onChange={setDbType}
//                 options={dbTypeOptions}
//                 style={{ width: '100%' }}
//               />
//               <Input
//                 placeholder="主机地址"
//                 value={host}
//                 onChange={(e) => setHost(e.target.value)}
//               />
//               <Input
//                 placeholder="端口"
//                 value={port}
//                 onChange={(e) => setPort(e.target.value)}
//               />
//               <Input
//                 placeholder="用户名"
//                 value={username}
//                 onChange={(e) => setUsername(e.target.value)}
//               />
//               <Input.Password
//                 placeholder="密码"
//                 value={password}
//                 onChange={(e) => setPassword(e.target.value)}
//               />
//               <Input
//                 placeholder="数据库名"
//                 value={database}
//                 onChange={(e) => setDatabase(e.target.value)}
//               />
//             </Space>
//           </Modal>
//           <Handle className="handle" id="0" type="target" position={Position.Top} />
//           <Handle className="handle" id="0" type="source" position={Position.Bottom} />
//         </Shell>
//       ) : (
//         <Alert
//           message="提示"
//           description="数据库功能仅在桌面端可用"
//           type="warning"
//         />
//       )}
//     </div>
//   );
// } 
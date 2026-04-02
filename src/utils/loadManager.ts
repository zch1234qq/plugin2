// type LoadStatus = {
//   isLoading: boolean;
//   isLoaded: boolean;
//   error: string | null;
// };

// class LoadManager {
//   private static instance: LoadManager;
//   private pyodideStatus: LoadStatus = { isLoading: false, isLoaded: false, error: null };
//   private pyodide: any = null;

//   private constructor() {}

//   public static getInstance(): LoadManager {
//     if (!LoadManager.instance) {
//       LoadManager.instance = new LoadManager();
//     }
//     return LoadManager.instance;
//   }

//   /**
//    * 懒加载 Pyodide
//    */
//   public async loadPyodide(): Promise<any> {
//     if (this.pyodideStatus.isLoaded) {
//       return this.pyodide;
//     }

//     if (this.pyodideStatus.isLoading) {
//       return new Promise((resolve, reject) => {
//         const check = setInterval(() => {
//           if (this.pyodideStatus.isLoaded) {
//             clearInterval(check);
//             resolve(this.pyodide);
//           }
//           if (this.pyodideStatus.error) {
//             clearInterval(check);
//             reject(this.pyodideStatus.error);
//           }
//         }, 100);
//       });
//     }

//     this.pyodideStatus.isLoading = true;

//     try {
//       const { loadPyodide } = await import('pyodide');
//       this.pyodide = await loadPyodide({
//         indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.23.4/full/'
//       });
//       this.pyodideStatus.isLoaded = true;
//       return this.pyodide;
//     } catch (error: any) {
//       this.pyodideStatus.error = error.message;
//       throw error;
//     } finally {
//       this.pyodideStatus.isLoading = false;
//     }
//   }
//   public getPyodide() {
//     return this.pyodide;
//   }
// }

// export const loadManager = LoadManager.getInstance(); 
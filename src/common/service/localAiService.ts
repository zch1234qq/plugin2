import { requestLocalLLM } from "../llm";
import { globalStore, stateLocalLLM, stateUserInfo } from "../store/store";
import { DataGpt, TypePromise, TypeRespLLM } from "../types/types";
import { LogError } from "./server";
import utilsSerivice from "./utilsSerivice";

function wrapLocalResponse(dataLLM: TypeRespLLM): { data: DataGpt } {
    return {
        data: {
            success: dataLLM.done,
            code: 1,
            message: dataLLM.done_reason,
            msg: dataLLM.response,
            total_tokens: 0
        }
    }
}

function buildOcrPrompt(prompt: string, ques: string): string {
    let normalized = prompt
    switch (prompt) {
        case "":
        case "0":
            normalized = "请识别图片中的文字内容，尽量保留原有结构，只返回识别结果，不要添加解释。"
            break
        case "1":
            normalized = "请识别图片中的表格内容，并尽量按原有表格结构输出。"
            break
        case "2":
            normalized = "请完整识别图片中的文章内容，尽量保留标题、段落和换行结构，只返回识别后的正文，不要添加解释。"
            break
        default:
            normalized = prompt
            break
    }
    return [normalized, ques].filter(Boolean).join("\n")
}

async function Gptprompt(prompt: string, question: string, _sharer?: string): TypePromise<DataGpt> {
    try {
        const localLLM = globalStore.get(stateLocalLLM)
        const dataLLM = await requestLocalLLM(localLLM.text, {
            prompt: utilsSerivice.ProcessPromopt(prompt) + question
        })
        return wrapLocalResponse(dataLLM)
    } catch (error: any) {
        LogError("localAiGptprompt", globalStore.get(stateUserInfo).phone, error?.message || "")
        throw new Error("请正确接入本地文字大模型")
    }
}

async function GptOcr(prompt: string, img: string, ques: string, _sharer?: string): TypePromise<DataGpt> {
    try {
        const localLLM = globalStore.get(stateLocalLLM)
        const dataLLM = await requestLocalLLM(localLLM.ocr, {
            prompt: buildOcrPrompt(prompt, ques),
            imageUrl: img
        })
        return wrapLocalResponse(dataLLM)
    } catch (error: any) {
        LogError("localAiGptOcr", globalStore.get(stateUserInfo).phone, error?.message || "")
        throw new Error("请正确接入本地OCR大模型")
    }
}

async function GptImg(prompt: string, img: string, ques: string, _sharer?: string): TypePromise<DataGpt> {
    try {
        const localLLM = globalStore.get(stateLocalLLM)
        const dataLLM = await requestLocalLLM(localLLM.img, {
            prompt: utilsSerivice.ProcessPromopt(prompt) + ques,
            imageUrl: img,
            numCtx: 1024
        })
        return wrapLocalResponse(dataLLM)
    } catch (error: any) {
        LogError("localAiGptImg", globalStore.get(stateUserInfo).phone, error?.message || "")
        throw new Error("请正确接入本地视觉大模型")
    }
}

async function GptSearch(prompt: string, question: string, _sharer?: string): TypePromise<DataGpt> {
    try {
        const localLLM = globalStore.get(stateLocalLLM)
        const dataLLM = await requestLocalLLM(localLLM.search, {
            prompt: utilsSerivice.ProcessPromopt(prompt) + question
        })
        return wrapLocalResponse(dataLLM)
    } catch (error: any) {
        LogError("localAiGptSearch", globalStore.get(stateUserInfo).phone, error?.message || "")
        throw new Error("请正确接入本地搜索大模型")
    }
}

export default {
    Gptprompt,
    GptOcr,
    GptImg,
    GptSearch
}

import { globalStore, stateLocalLLM } from "../store/store";
import { DataGpt, TypePromise } from "../types/types";
import localAiService from "./localAiService";
import mqrb, { PollOptions } from "./mqrb";

function shouldUseLocal() {
    return globalStore.get(stateLocalLLM).local
}

async function Gptprompt(prompt: string, question: string, sharer?: string): TypePromise<DataGpt> {
    return shouldUseLocal()
        ? localAiService.Gptprompt(prompt, question, sharer)
        : mqrb.Gptprompt(prompt, question, sharer)
}

async function GptOcr(prompt: string, img: string, ques: string, sharer?: string): TypePromise<DataGpt> {
    return shouldUseLocal()
        ? localAiService.GptOcr(prompt, img, ques, sharer)
        : mqrb.GptOcr(prompt, img, ques, sharer)
}

async function GptImg(prompt: string, img: string, ques: string, sharer?: string): TypePromise<DataGpt> {
    return shouldUseLocal()
        ? localAiService.GptImg(prompt, img, ques, sharer)
        : mqrb.GptImg(prompt, img, ques, sharer)
}

async function GptSearch(prompt: string, question: string, sharer?: string): TypePromise<DataGpt> {
    return shouldUseLocal()
        ? localAiService.GptSearch(prompt, question, sharer)
        : mqrb.GptSearch(prompt, question, sharer)
}

async function pollMqJson(taskid: string, options: PollOptions = {}): TypePromise<DataGpt> {
    return mqrb.pollMqJson(taskid, options)
}

export default {
    Gptprompt,
    GptOcr,
    GptImg,
    GptSearch,
    pollMqJson
}

import { OpenAIApi, Configuration } from "openai-edge";

const config = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(config);

export async function getEmbeddings(text: string) {
  try {
    const response = await openai.createEmbedding({
      model: "text-embedding-ada-002",
      input: text.replace(/\n/, " "),
    });

    const result = await response.json();
    if (result.object == "list") {
      // console.log(result);
      return result.data[0].embedding as number[];
    }
  } catch (error) {
    console.log("error calling open ai embedding api ", error);
    throw error;
  }
}

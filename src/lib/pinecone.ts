import { Pinecone, PineconeRecord } from "@pinecone-database/pinecone";
import { downloadFromS3 } from "./s3-server";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import {
  Document,
  RecursiveCharacterTextSplitter,
} from "@pinecone-database/doc-splitter";
import { getEmbeddings } from "./embaddings";
import md5 from "md5";
import { Vector } from "@pinecone-database/pinecone/dist/pinecone-generated-ts-fetch";
import { convertToAscii } from "./utils";

let pinecone: Pinecone | null = null;

export const getPineconeClient = async () => {
  if (!pinecone) {
    pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY!,
    });
  }

  return pinecone;
};

type PDFPage = {
  pageContent: string;
  metadata: {
    loc: { pageNumber: number };
  };
};

export async function loadS3ToPinecone(file_key: string) {
  // 1. Obtain PDF
  console.log("Downloading file from S3 to file system...");
  const file_name = await downloadFromS3(file_key);

  if (!file_name) {
    throw new Error("File not found: " + file_key);
  }

  const loader = new PDFLoader(file_name);
  const pages = (await loader.load()) as PDFPage[];

  // 2. Split and segment
  console.log("Splitting to segments ...");
  const documents = await Promise.all(pages.map(prepareDocument));

  // 3. Vector and embed document
  console.log("Vectorise and embed document ...");
  let vectors = await Promise.all(documents.flat().map(embedDocument));
  vectors = vectors.filter((vector) => vector.values != undefined);

  // 4. Upload to pinecone
  const client = await getPineconeClient();
  const pineconeIndex = client.Index("chatpdf");

  console.log("inserting vectors to pinecone db");
  const namespace = convertToAscii(file_key);

  await pineconeIndex.namespace(namespace).upsert(vectors);

  return documents[0];
}

async function embedDocument(doc: Document) {
  try {
    const embeddings = await getEmbeddings(doc.pageContent);
    const hash = md5(doc.pageContent);

    return {
      id: hash,
      values: embeddings,
      metadata: {
        text: doc.metadata.text,
        pageNumber: doc.metadata.pageNumber,
      },
    } as PineconeRecord;
  } catch (error) {
    console.log("Error while embedding document", error);
    throw error;
  }
}

export const truncateByBytes = (str: string, bytes: number) => {
  const enc = new TextEncoder();
  return new TextDecoder("utf-8").decode(enc.encode(str).slice(0, bytes));
};

async function prepareDocument(page: PDFPage) {
  let { pageContent, metadata } = page;
  pageContent = pageContent.replace(/\n/, "");

  const splitter = new RecursiveCharacterTextSplitter();
  const docs = await splitter.splitDocuments([
    new Document({
      pageContent,
      metadata: {
        pageNumber: metadata.loc.pageNumber,
        text: truncateByBytes(pageContent, 36000),
      },
    }),
  ]);
  return docs;
}

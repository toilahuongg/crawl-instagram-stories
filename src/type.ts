export type TConfig = {
  username: string, 
  password: string;
}
export type TDataStory = { image: string, video: string };

export type TDataHighlight = { title: string, thumbnail: string, data: TDataStory[] };
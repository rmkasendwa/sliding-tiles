declare module '*.mp3';
declare module '*.wav' {
  const content: string;
  export default content;
}

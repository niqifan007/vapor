declare module "vditor/dist/method.min" {
  import type { IPreviewOptions } from "vditor";

  interface VditorPreviewStatic {
    preview(
      previewElement: HTMLDivElement,
      markdown: string,
      options?: IPreviewOptions
    ): void;
    md2html(mdText: string, options?: IPreviewOptions): Promise<string>;
  }

  const VditorPreview: VditorPreviewStatic;
  export default VditorPreview;
}

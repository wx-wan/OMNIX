import { useState } from "react";
import { CircleOff, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AppShell } from "../shared";
import macbookJpg from "src/assets/images/products/advance-macbook.jpg";
import beautyProduct from "src/assets/images/products/beauty-product.png";
import boatHeadphone from "src/assets/images/products/boat-headphone.png";
import littleAngelToy from "src/assets/images/products/little-angel-toy.png";
import newBook from "src/assets/images/products/new-book.png";
import newGames from "src/assets/images/products/new-games.png";
import macbookPng from "src/assets/images/products/advance-macbook.png";
import shoes from "src/assets/images/products/shoes.png";
import teddybear from "src/assets/images/products/teddybear.png";
import toyDino from "src/assets/images/products/toy-dino.png";
import womanDress from "src/assets/images/products/woman-dress.png";

/**
 * V2 续 · /apps/image-ai 逐项 1:1
 *
 * 取证：标题卡 "Image-AI"（1142×62）；主体卡 1142×1357，内部 1092×1323
 * = 生成器区（标题 + Prompt 卡 1092×246 + 5 参数 pill + Generate/Clear）
 * + Recent Images 卡 1092×973，其内部是 `columns-2 md:columns-4` 瀑布流，
 * 11 张 262px 图按 /images/products/* 同名资源逐项还原（含 315/285/271/147px 的自然高度差）。
 */
const IMAGES = [
  { src: macbookJpg, alt: "advance-macbook" },
  { src: beautyProduct, alt: "beauty-product" },
  { src: boatHeadphone, alt: "boat-headphone" },
  { src: littleAngelToy, alt: "little-angel-toy" },
  { src: newBook, alt: "new-book" },
  { src: newGames, alt: "new-games" },
  { src: macbookPng, alt: "advance-macbook-alt" },
  { src: shoes, alt: "shoes" },
  { src: teddybear, alt: "teddybear" },
  { src: toyDino, alt: "toy-dino" },
  { src: womanDress, alt: "woman-dress" },
];

const PARAMS = ["Landscape (4:3)", "No style", "No Tone", "No Lighting", "No Camera"];

const ImageAI = () => {
  const [generated, setGenerated] = useState(false);

  return (
    <AppShell title="Image-AI">
      <Card className="px-6">
        <div className="flex h-full flex-auto flex-col gap-5">
          {/* 生成器区 1092×330 */}
          <div className="flex min-h-[330px] flex-col gap-4">
            <div className="flex flex-col gap-1">
              <h2 className="text-base font-semibold">AI Image generator</h2>
              <p className="text-sm text-muted-foreground">
                Create an image with Generative AI by describing what you'd like to see. Please note, all images are shared publicly by default.
              </p>
            </div>

            {/* Prompt 卡 1092×246 */}
            <div className="flex flex-col gap-4 rounded-md border border-border p-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold">Prompt</label>
                <textarea
                  placeholder="Describe the image you want to generate"
                  rows={3}
                  className="min-h-[68px] w-full resize-none rounded-md bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
              </div>
              <div className="flex flex-col gap-6">
                <div className="flex flex-wrap items-center gap-2">
                  <label className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-muted">
                    <ImagePlus className="h-4 w-4" />
                    <input type="file" className="hidden" />
                  </label>
                  {PARAMS.map((p) => (
                    <button
                      key={p}
                      className="flex h-8 items-center gap-1.5 rounded-md border border-border px-2.5 text-xs hover:bg-muted"
                    >
                      <CircleOff className="h-3.5 w-3.5 text-muted-foreground" /> <span>{p}</span>
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="bg-foreground text-background hover:bg-foreground/90" onClick={() => setGenerated(true)}>
                    <span>Generate</span>
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setGenerated(false)}>
                    <span>Clear</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* 线上有一个尺寸为 0 的隐藏 Results 卡；生成后展示 */}
          <Card className={generated ? "py-4" : "hidden"}>
            <span className="px-6 text-sm font-semibold">Results</span>
          </Card>

          {/* Recent Images 卡 1092×973 */}
          <Card className="py-4">
            <div className="flex flex-col gap-4">
              <h3 className="text-base font-semibold">Recent Images</h3>
              <div className="columns-2 space-y-0 md:columns-4">
                {IMAGES.map(({ src, alt }) => (
                  <div key={alt} className="mb-4 break-inside-avoid">
                    <img src={src} alt={alt} className="w-full rounded-lg" />
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </Card>
    </AppShell>
  );
};

export default ImageAI;

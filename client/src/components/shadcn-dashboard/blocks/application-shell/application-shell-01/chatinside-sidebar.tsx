import React from "react";
import { uniq, flatten } from "lodash";
import SimpleBar from "simplebar-react";
import "simplebar-react/dist/simplebar.min.css";
import { Download } from "lucide-react";
import { Chat } from "@/components/shadcn-dashboard/blocks/application-shell/application-shell-01/types";

type Props = {
  selectedChat: Chat | null;
};

const ChatInsideSidebar = ({ selectedChat }: Props) => {
  const totalAttachment = uniq(
    flatten(selectedChat?.messages.map((item) => item.attachment))
  ).length;
  const totalMedia =
    uniq(
      flatten(
        selectedChat?.messages.map((item) =>
          item?.type === "image" ? item.msg : null
        )
      )
    ).length - 1;

  return (
    <>
      <div className="p-0">
        {/* Media */}
        <div className="p-5">
          <h6 className="text-sm"> Media ({totalMedia})</h6>
          <div className="mt-4">
            <>
              <React.Fragment>
                {selectedChat?.messages.map((c, index) => (
                  <div
                    className="md:col-span-4 sm:col-span-6 col-span-12"
                    key={index}
                  >
                    {c?.type === "image" ? (
                      <img src={c.msg} alt="media" className="rounded-md" />
                    ) : null}
                  </div>
                ))}
              </React.Fragment>
            </>
          </div>
        </div>
        {/* Files */}
        <div>
          <SimpleBar className="max-h-75">
            <div className="px-5">
              <h6 className="text-sm"> Attachments ({totalAttachment})</h6>

              {selectedChat?.messages.map((c, index) => (
                <div key={index}>
                  <div className="flex flex-col gap-4 mt-4">
                    {c?.attachment?.map((a, index) => (
                      <div key={index}>
                        <div className="flex items-center gap-3 group cursor-pointer">
                          <div className="bg-background border border-border p-3 rounded-md">
                            <img src={a.icon || ""} alt="download" />
                          </div>
                          <div>
                            <h5 className="text-sm group-hover:text-primary">
                              {a.file}
                            </h5>
                            <p className="text-xs text-muted-foreground">
                              {a.fileSize}
                            </p>
                          </div>
                          <div className="h-9 w-9 flex justify-center items-center rounded-lg hover:bg-primary/5 hover:text-primary cursor-pointer bg-transparent invisible group-hover:visible ms-auto opacity:50">
                            <Download size="20" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </SimpleBar>
        </div>
      </div>
    </>
  );
};

export default ChatInsideSidebar;

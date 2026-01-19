import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

const RichTextEditor = ({
    value, 
    onChange,
}:{
    value: string;
    onChange: (value: string) => void;
}) => {
    const [editorValue, setEditorValue] = useState(value || "");
    const quillRef = useRef(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!quillRef.current) {
            quillRef.current = true;
            
            setTimeout(() => {
                if (containerRef.current) {
                    containerRef.current.querySelectorAll(".ql-toolbar")
                        .forEach((toolbar, index) => {
                            if (index > 0) {
                                toolbar.remove();
                            }
                        });
                }
            }, 100);
        }
}, []);
    return (
        <div className="relative" ref={containerRef}>
            <ReactQuill
                theme="snow"
                value={editorValue}
                onChange={(content) => {
                    setEditorValue(content);
                    onChange(content);
                }}
                modules={{
                    toolbar:[
                        [{font:[]}],
                        [{header:[1,2,3,4,5,6,false]}],
                        [{size:["small,"]}],
                        ["bold","italic","underline","strike"],
                        [{color:[]},{background:[]}],
                        [{script:"sub"},{script:"super"}],
                        [{list:"ordered"},{list:"bullet"},
                        {indent:"-1"},{indent:"+1"}],
                        [{direction:"rtl"}],
                        [{align:[]}],
                        ["link","image","video","blockquote","code-block"],
                        ["clean"]
                    ],
                }
                }
                placeholder="Write a detailed product description here..."
                className="bg-transparent border border-gray-700 text-white rounded-md"
                style={{ minHeight: '250px', }}
            />
            <style>
                {
                    `
                    .ql-toolbar.ql-snow {
                        background: transparent;
                        border-color: #444;
                    }
                    .ql-container.ql-snow {
                        background: transparent;
                        border-color: #444;
                        color: white;
                    }
                    .ql-picker{
                        color: white!important;
                    }
                    .ql-editor{
                        min-height: 200px;
                    }
                    .ql-snow{
                        border-color: #444!important;
                    }
                    .ql-editor.ql-blank::before{
                        color:#aaa !important;
                    }
                    .ql-picker-options{
                        background: #333 !important;
                        color:white !important;
                    }
                    .ql-picker-item{
                        color:white !important;
                    }
                    .ql-stroke{
                        stroke:#fff !important;
                    }
                    `
                }
            </style>
        </div>
    );
}
export default RichTextEditor;
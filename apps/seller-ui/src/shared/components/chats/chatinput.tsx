import { PickerProps } from "emoji-picker-react";
import dynamic from "next/dynamic";
import React, { useState } from "react";
import { Send, ImageIcon, Smile } from "lucide-react";

const EmojiPicker = dynamic(
  () =>
    import("emoji-picker-react").then(
      (mod) => mod.default as React.FC<PickerProps>
    ),
  { ssr: false }
);
const ChatInput = ({
  onSendMessage,
  message,
  setMessage,
}: {
  onSendMessage: (e: any) => void;
  message: string;
  setMessage: React.Dispatch<React.SetStateAction<string>>;
}) => {
  const [showEmoji, setShowEmoji] = useState(false);
  const handleEmojiClick = (emojiData: any) => {
    setMessage((prev) => prev + emojiData.emoji);
    setShowEmoji(false);
  };
  const handleImageupload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log("Uploading image:", file.name);
    }
  };

  return (
    <form
      onSubmit={onSendMessage}
      className="border-t border-t-gray-2oo bg-white px-4 py-3 flex items-center gap-2 relative"
    >
      {/*Upload Icon*/}
      <label className="cursor-pointer p-2 hover:bg-gray-100 rounded-md">
        <ImageIcon className="cursor-pointer" />
        <input
          id="file"
          type="file"
          accept="image/*"
          onChange={handleImageupload}
          className="hidden"
        />
      </label>
      {/*Emoji Picker*/}
      <div className="relative">
        <button
            type="button"
            onClick={() => setShowEmoji((prev) => !prev)} 
            className="p-2 hover:bg-gray-100 rounded-md"
        >
            <Smile className='w-5 h-5 text-gray-600' />
        </button>
        {showEmoji && (
            <div className="absolute bottom-10 left-0 z-50">
                <EmojiPicker onEmojiClick={handleEmojiClick} />
            </div>
        )}
      </div>
      {/*Input Field*/}
      <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      {/*Send Button*/}
      <button
          type="submit"
          className="p-2 hover:bg-blue-600 rounded-md bg-blue-500 text-white font-semibold"
      >
          <Send className='w-5 h-5 text-white' />
      </button>
    </form>
  );
};

export default ChatInput;

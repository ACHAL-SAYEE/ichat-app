import React from "react";
import "./index.css";
const GroupMessage = (props) => {
  const { messageDetails, currentUser, MessageSenderName } = props;
  const { message, time, sender } = messageDetails;
  const messageAlignmentClass = sender === currentUser ? "right" : "left";
console.log(MessageSenderName,!MessageSenderName === "")
  const MessageColorClass =
    sender === currentUser ? "sentMessage" : "recievedMessage";
  const MsgSentTime = new Date(time);
  const currentHour = MsgSentTime.getHours();
  const currentMinute = MsgSentTime.getMinutes();
  return (
    <div className={`chat-item ${messageAlignmentClass}`}>
      <div className="msg-info">
        <p>
          {currentHour}:{currentMinute}
        </p>
      </div>

      <div className={`group-message-content ${MessageColorClass}`}>
        {!(MessageSenderName === "") && <p className="sender">{MessageSenderName}</p>}
        <p className="group-msg-content">{message}</p>
      </div>
    </div>
  );
};
export default GroupMessage;

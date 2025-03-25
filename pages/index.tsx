import { useChat } from '@ai-sdk/react';
import React from 'react';

// Helper function to find and convert URLs into links
function renderTextWithLinks(text: string) {
  // First, handle markdown-style links [text](url)
  const markdownLinkRegex = /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g;
  let processedText = text;
  const markdownElements: JSX.Element[] = [];
  
  // Replace markdown links with placeholders and store the elements
  let markdownMatch;
  let placeholderIndex = 0;
  while ((markdownMatch = markdownLinkRegex.exec(text)) !== null) {
    const [fullMatch, linkText, url] = markdownMatch;
    const placeholder = `__LINK_PLACEHOLDER_${placeholderIndex}__`;
    processedText = processedText.replace(fullMatch, placeholder);
    
    markdownElements.push(
      <a 
        key={`markdown-${placeholderIndex}`}
        href={url} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="text-blue-500 underline"
      >
        {linkText}
      </a>
    );
    
    placeholderIndex++;
  }
  
  // Now handle plain URLs, but be careful not to match URLs that were part of markdown links
  const urlRegex = /(https?:\/\/[^\s]+)(?=[\s,.!?;:]|$)/g;
  
  if (!urlRegex.test(processedText) && markdownElements.length === 0) {
    return text;
  }
  
  const parts = processedText.split(urlRegex);
  const matches = processedText.match(urlRegex) || [];
  
  // Combine parts with URL links and markdown placeholders
  const result = parts.map((part, index) => {
    const elements = [];
    
    // Add the text part
    if (part) {
      // Check if this part contains any placeholders and replace them
      let remainingPart = part;
      for (let i = 0; i < markdownElements.length; i++) {
        const placeholder = `__LINK_PLACEHOLDER_${i}__`;
        if (remainingPart.includes(placeholder)) {
          const [before, after] = remainingPart.split(placeholder);
          if (before) elements.push(before);
          elements.push(markdownElements[i]);
          remainingPart = after;
        }
      }
      if (remainingPart) elements.push(remainingPart);
    }
    
    // Add the URL link if there is one for this part
    if (matches[index]) {
      elements.push(
        <a 
          key={`url-${index}`}
          href={matches[index]} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-blue-500 underline"
        >
          {matches[index]}
        </a>
      );
    }
    
    return <React.Fragment key={index}>{elements}</React.Fragment>;
  });
  
  return result;
}

export default function Chat() {
  // Rest of the component remains the same
  const { messages, input, handleInputChange, handleSubmit } = useChat();
  
  return (
    <div className="flex flex-col w-full max-w-md py-24 mx-auto stretch">
      {messages.map(message => (
        <div key={message.id} className="whitespace-pre-wrap mb-4">
          <strong>{message.role === 'user' ? 'User: ' : 'AI: '}</strong>
          {message.parts.map((part, i) => {
            switch (part.type) {
              case 'text':
                return <div key={`${message.id}-${i}`}>{renderTextWithLinks(part.text)}</div>;
              default:
                return <div key={`${message.id}-${i}`}>{part.text}</div>;
            }
          })}
        </div>
      ))}

      <form onSubmit={handleSubmit}>
        <input
          className="fixed dark:bg-zinc-900 bottom-0 w-full max-w-md p-2 mb-8 border border-zinc-300 dark:border-zinc-800 rounded shadow-xl"
          value={input}
          placeholder="Say something..."
          onChange={handleInputChange}
        />
      </form>
    </div>
  );
}
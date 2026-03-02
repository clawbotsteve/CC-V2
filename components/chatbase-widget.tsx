'use client';

const ChatbaseWidget = () => {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          (function () {
            if (!window.chatbase || window.chatbase("getState") !== "initialized") {
              window.chatbase = (...args) => {
                (window.chatbase.q = window.chatbase.q || []).push(args);
              };
              window.chatbase = new Proxy(window.chatbase, {
                get(target, prop) {
                  if (prop === "q") return target.q;
                  return (...args) => target(prop, ...args);
                },
              });
            }

            const script = document.createElement("script");
            script.src = "https://www.chatbase.co/embed.min.js";
            script.id = "pTjZPFOQ6pFQi1sG0rs-A"; // Use your actual Chatbase bot ID here
            script.dataset.domain = "www.chatbase.co";
            document.body.appendChild(script);
          })();
        `,
      }}
    />
  );
};

export default ChatbaseWidget;

import React, { useEffect, useState } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import RemarkMath from "remark-math";
import RemarkBreaks from "remark-breaks";
import RehypeKatex from "rehype-katex";
import rehypeHighlight from 'rehype-highlight';
import { usePathname } from 'next/navigation';
import CodeBlock from '@/app/components/CodeBlock';
import SvgFileCard from '@/app/components/artifact/SvgFileCard';
import useSvgPreviewSidebarStore from '@/app/store/svgPreviewSidebar';
import 'highlight.js/styles/github.css';
import "katex/dist/katex.min.css";
import 'github-markdown-css/github-markdown-light.css';
import crypto from 'crypto';

const MarkdownRender = (props: {
  content: string,
}
) => {
  const pathname = usePathname();
  const {
    setIsOpen,
    resetActiveCard
  } = useSvgPreviewSidebarStore();
  const [processedContent, setProcessedContent] = useState(props.content);
  const [svgBlocks, setSvgBlocks] = useState<{ id: string, content: string }[]>([]);
  const [currentPath, setCurrentPath] = useState(pathname);

  // 处理括号转义
  function escapeBrackets(text: string) {
    const pattern =
      /(```[\s\S]*?```|`.*?`)|\\\[([\s\S]*?[^\\])\\\]|\\\((.*?)\\\)/g;
    return text.replace(
      pattern,
      (match, codeBlock, squareBracket, roundBracket) => {
        if (codeBlock) {
          return codeBlock;
        } else if (squareBracket) {
          return `$$${squareBracket}$$`;
        } else if (roundBracket) {
          return `$${roundBracket}$`;
        }
        return match;
      },
    );
  }

  // 监听路径变化，当对话切换时关闭侧边栏并清除高亮
  useEffect(() => {
    // 提取当前路径中的聊天ID
    const currentChatId = pathname.split("/").pop() || '';
    // 提取之前路径中的聊天ID
    const previousChatId = currentPath.split("/").pop() || '';

    // 检查聊天ID是否发生变化（对话切换）
    if (currentChatId !== previousChatId) {
      setCurrentPath(pathname);
      // 无论侧边栏是否打开，都重置状态
      setIsOpen(false);
      resetActiveCard();
    }
  }, [pathname, currentPath, setIsOpen, resetActiveCard]);

  // 生成基于内容的哈希 ID
  const generateContentBasedId = (content: string): string => {
    // 使用 MD5 哈希算法生成基于内容的哈希值
    // MD5 足够快速且碰撞概率低，适合此用例
    return `svg-${crypto.createHash('md5').update(content).digest('hex').substring(0, 10)}`;
  };

  // 预处理内容，提取 SVG 代码块
  useEffect(() => {
    const escaped = escapeBrackets(props.content);

    // 匹配 SVG 代码块
    const svgBlockRegex = /```(?:xml|svg|html)?\s*(<svg[\s\S]*?<\/svg>)\s*```/g;
    const matches = [...escaped.matchAll(svgBlockRegex)];

    // 提取 SVG 内容并生成基于内容的唯一 ID
    const extractedSvgBlocks = matches.map(match => {
      const svgContent = match[1];
      // 使用基于内容的哈希值作为 ID，确保相同内容始终获得相同的 ID
      const id = generateContentBasedId(svgContent);
      return { id, content: svgContent };
    });

    setSvgBlocks(extractedSvgBlocks);

    // 替换 SVG 代码块为特殊格式的代码块
    let processed = escaped;
    extractedSvgBlocks.forEach(block => {
      const regex = new RegExp(`\`\`\`(?:xml|svg|html)?\\s*(${block.content.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})\\s*\`\`\``, 'g');
      processed = processed.replace(regex, `\`\`\`svg-card-${block.id}\n${block.content}\n\`\`\``);
    });

    setProcessedContent(processed);
  }, [props.content]);

  return (
    <>
      {/* 渲染 Markdown 内容 */}
      <Markdown
        remarkPlugins={[RemarkMath, remarkGfm, RemarkBreaks]}
        rehypePlugins={[
          RehypeKatex as any,
          [
            rehypeHighlight as any,
            {
              detect: false,
              ignoreMissing: true,
            },
          ],
        ]}
        components={{
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || "");
            // 检查是否是 SVG 卡片代码块
            if (!inline && match && match[1].includes('svg') && className) {
              // 从类名中提取 ID
              const id = className.replace('hljs language-svg-card-', '');
              // 查找对应的 SVG 块
              const svgBlock = svgBlocks.find(block => block.id === id);
              if (svgBlock) {
                return <SvgFileCard
                  svgContent={svgBlock.content}
                  cardId={svgBlock.id}
                />;
              }
            }

            return !inline && match ? (
              <CodeBlock language={match[1]}>{children}</CodeBlock>
            ) : (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
          a: (aProps: React.AnchorHTMLAttributes<HTMLAnchorElement> & { 'data-footnote-ref'?: string }) => {
            const isFootnote = aProps['data-footnote-ref'] !== undefined;
            if (isFootnote) {
              return <span style={{ backgroundColor: '#d0e1fd', fontFamily: '', fontSize: '9px', marginRight: '3px', borderRadius: '11px', padding: '1px 4px' }} {...aProps}>{aProps.children}</span>;
            }
            const href = aProps.href || "";
            if (/\.(aac|mp3|opus|wav)$/.test(href)) {
              return (
                <figure>
                  <audio controls src={href}></audio>
                </figure>
              );
            }
            if (/\.(3gp|3g2|webm|ogv|mpeg|mp4|avi)$/.test(href)) {
              return (
                <video controls width="99.9%">
                  <source src={href} />
                </video>
              );
            }
            const isInternal = /^\/(?!\/)|^\.\/|^#/.test(href);
            const target = isInternal ? "_self" : aProps.target ?? "_blank";
            return <a {...aProps} target={target} />;
          },
        }}
      >
        {processedContent}
      </Markdown>
    </>
  );
};

export default MarkdownRender;

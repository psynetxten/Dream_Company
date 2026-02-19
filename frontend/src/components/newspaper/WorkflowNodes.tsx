"use client";

import React from "react";

const agents = [
    { id: "writer", name: "수석 기자", color: "blue" },
    { id: "marketing", name: "마케팅 팀장", color: "purple" },
    { id: "content", name: "콘텐츠 디렉터", color: "green" },
];

export default function WorkflowNodes() {
    return (
        <div className="flex items-center justify-center gap-6 mb-12 p-6 bg-pro-bg rounded-2xl border border-pro-border overflow-x-auto">
            {agents.map((agent, index) => (
                <React.Fragment key={agent.id}>
                    <div className="workflow-node group hover:border-pro-accent transition-colors">
                        <div className="node-label">Agent Node</div>
                        <div className="node-title flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full bg-pro-accent animate-pulse`}></span>
                            {agent.name}
                        </div>
                        {index < agents.length - 1 && <div className="node-connector" />}
                    </div>
                    {index < agents.length - 1 && (
                        <div className="text-pro-text-muted">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                                <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
                            </svg>
                        </div>
                    )}
                </React.Fragment>
            ))}
            <div className="workflow-node border-pro-accent">
                <div className="node-label">Output</div>
                <div className="node-title font-headline">DREAM NEWS</div>
            </div>
        </div>
    );
}

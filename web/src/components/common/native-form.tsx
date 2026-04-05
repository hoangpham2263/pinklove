"use client";

import { FormHTMLAttributes } from"react";

export function NativeForm(props:FormHTMLAttributes<HTMLFormElement>) { return (
 <form
 {...props }
 onSubmit={(e) => { if (props.onSubmit) { props.onSubmit(e); }
 if (!e.defaultPrevented) { e.preventDefault();
 e.currentTarget.submit(); } } }
 />
 ); }
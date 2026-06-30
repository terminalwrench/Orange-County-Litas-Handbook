import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input className="form-control" type="text" {...props} />;
}

export function DateInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input className="form-control" type="date" {...props} />;
}

export function TimeInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input className="form-control" type="time" {...props} />;
}

export function SelectInput(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className="form-control" {...props} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className="form-control form-control--textarea" {...props} />;
}

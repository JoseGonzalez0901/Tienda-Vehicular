import React from "react";
import { Toaster as Sonner } from "sonner";
export type ToasterProps = React.ComponentProps<typeof Sonner>;
export const Toaster = (props: ToasterProps) => (<Sonner theme="dark" position="top-center" richColors {...props} />);
export default Toaster;

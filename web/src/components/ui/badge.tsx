import * as React from"react"
import { cn } from"@/lib/utils"

function Badge({ className, ...props }: React.ComponentProps<"span"> & { variant?: string }) {
 return (
 <span
  data-slot="badge"
  className={cn(" capitalize", className)}
  {...props}
 />
 )
}

export { Badge }

"use client"

import { useState } from "react"
import { ConnectPanel } from "@/components/dashboard/connect-panel"
import { UploadDropzone } from "@/components/dashboard/upload-dropzone"
import { RecentFiles } from "@/components/dashboard/recent-files"

export default function Dashboard() {
  const [refreshKey, setRefreshKey] = useState(0)

  return (
    <div className="space-y-5">
      <ConnectPanel />
      <UploadDropzone onUploaded={() => setRefreshKey((key) => key + 1)} />
      <RecentFiles refreshKey={refreshKey} />
    </div>
  )
}

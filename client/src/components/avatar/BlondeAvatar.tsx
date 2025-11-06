import React from 'react';

interface BlondeAvatarModelProps {
  text: string;
  className?: string;
}

function BlondeAvatarModel({ text, className }: BlondeAvatarModelProps) {
  return (
    <div className={`w-full h-full flex items-center justify-center bg-yellow-100 rounded ${className || ''}`}>
      <span className="text-yellow-700 text-sm">Blonde Avatar Disabled</span>
    </div>
  );
}

export default BlondeAvatarModel;
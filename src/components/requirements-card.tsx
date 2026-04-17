'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, Pencil } from 'lucide-react';
import type { RequirementsCard as RequirementsCardType } from '@/store/app-store';

interface RequirementsCardProps {
  card: RequirementsCardType;
  onConfirm: (card: RequirementsCardType) => void;
  onReject: () => void;
}

export function RequirementsCard({ card, onConfirm, onReject }: RequirementsCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedCard, setEditedCard] = useState<RequirementsCardType>(card);

  const fields = [
    { key: 'projectName' as const, label: 'Project Name' },
    { key: 'type' as const, label: 'Type' },
    { key: 'frontend' as const, label: 'Frontend' },
    { key: 'backend' as const, label: 'Backend' },
    { key: 'database' as const, label: 'Database' },
    { key: 'auth' as const, label: 'Auth' },
    { key: 'freeHosting' as const, label: 'Free Hosting' },
  ];

  return (
    <Card className="border-2" style={{ borderColor: '#30363d', backgroundColor: '#161b22' }}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2" style={{ color: '#58a6ff' }}>
            📋 PROJECT REQUIREMENTS CARD
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            style={{ color: '#8b949e' }}
            onClick={() => {
              if (isEditing) {
                setEditedCard(card);
              }
              setIsEditing(!isEditing);
            }}
          >
            {isEditing ? 'Cancel' : <><Pencil className="w-3 h-3 mr-1" /> Edit</>}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {fields.map((field) => (
          <div key={field.key} className="flex items-center gap-3 py-1">
            <span className="text-xs font-mono w-28 shrink-0" style={{ color: '#8b949e' }}>
              {field.label}
            </span>
            <span className="text-xs" style={{ color: '#484f58' }}>:</span>
            {isEditing ? (
              <Input
                value={editedCard[field.key]}
                onChange={(e) => setEditedCard({ ...editedCard, [field.key]: e.target.value })}
                className="h-7 text-xs font-mono bg-[#0d1117] border-[#30363d] text-[#c9d1d9] flex-1"
              />
            ) : (
              <span className="text-xs font-mono" style={{ color: '#c9d1d9' }}>
                {card[field.key]}
              </span>
            )}
          </div>
        ))}

        {/* Key Features */}
        <div className="flex items-start gap-3 py-1">
          <span className="text-xs font-mono w-28 shrink-0" style={{ color: '#8b949e' }}>
            Key Features
          </span>
          <span className="text-xs" style={{ color: '#484f58' }}>:</span>
          <div className="flex flex-wrap gap-1">
            {(isEditing ? editedCard : card).keyFeatures.map((feature, i) => (
              <span
                key={i}
                className="text-xs px-2 py-0.5 rounded-full"
                style={{ backgroundColor: 'rgba(88,166,255,0.15)', color: '#58a6ff' }}
              >
                {feature}
              </span>
            ))}
          </div>
        </div>

        {/* Estimated Files */}
        <div className="flex items-center gap-3 py-1">
          <span className="text-xs font-mono w-28 shrink-0" style={{ color: '#8b949e' }}>
            Est. Files
          </span>
          <span className="text-xs" style={{ color: '#484f58' }}>:</span>
          <span className="text-xs font-mono" style={{ color: '#c9d1d9' }}>
            {(isEditing ? editedCard : card).estimatedFiles} files across {(isEditing ? editedCard : card).estimatedDirs} directories
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-3">
          <Button
            size="sm"
            className="gap-1"
            style={{ backgroundColor: '#238636', color: 'white' }}
            onClick={() => onConfirm(isEditing ? editedCard : card)}
          >
            <Check className="w-3 h-3" /> Confirm & Build
          </Button>
          <Button
            variant="outline"
            size="sm"
            style={{ borderColor: '#30363d', color: '#8b949e' }}
            onClick={onReject}
          >
            Modify Requirements
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

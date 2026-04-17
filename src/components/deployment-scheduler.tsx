'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, Calendar, Play, Pause, Trash2 } from 'lucide-react';

interface ScheduleConfig {
  enabled: boolean;
  cron: string;
  timezone: string;
  lastRun: string | null;
  nextRun: string | null;
}

interface DeploymentSchedulerProps {
  projectId: string;
  projectName: string;
  currentSchedule?: ScheduleConfig;
  onSaveSchedule: (config: ScheduleConfig) => void;
}

const PRESET_CRONS = [
  { label: 'Every day at 9:00 AM', value: '0 0 9 * * ?' },
  { label: 'Every 6 hours', value: '0 0 0/6 * * ?' },
  { label: 'Every Monday at 10:00 AM', value: '0 0 10 ? * MON' },
  { label: 'Every weekday at 8:00 AM', value: '0 0 8 ? * MON-FRI' },
  { label: 'Every 12 hours', value: '0 0 0/12 * * ?' },
  { label: 'Custom', value: 'custom' },
];

const TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Berlin',
  'Asia/Kolkata',
  'Asia/Tokyo',
  'Australia/Sydney',
];

export function DeploymentScheduler({
  projectId,
  projectName,
  currentSchedule,
  onSaveSchedule,
}: DeploymentSchedulerProps) {
  const [enabled, setEnabled] = useState(currentSchedule?.enabled || false);
  const [cron, setCron] = useState(currentSchedule?.cron || '0 0 9 * * ?');
  const [customCron, setCustomCron] = useState('');
  const [timezone, setTimezone] = useState(currentSchedule?.timezone || 'UTC');
  const [selectedPreset, setSelectedPreset] = useState('0 0 9 * * ?');

  const handlePresetChange = (value: string) => {
    setSelectedPreset(value);
    if (value !== 'custom') {
      setCron(value);
    } else {
      setCron(customCron);
    }
  };

  const handleSave = () => {
    onSaveSchedule({
      enabled,
      cron: selectedPreset === 'custom' ? customCron : cron,
      timezone,
      lastRun: currentSchedule?.lastRun || null,
      nextRun: null,
    });
  };

  return (
    <Card style={{ backgroundColor: '#161b22', borderColor: '#30363d' }}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2" style={{ color: '#c9d1d9' }}>
            <Clock className="w-4 h-4" style={{ color: '#e3b341' }} />
            Deployment Schedule
          </CardTitle>
          <div className="flex items-center gap-2">
            <Label htmlFor="schedule-toggle" className="text-xs" style={{ color: '#8b949e' }}>
              {enabled ? 'Enabled' : 'Disabled'}
            </Label>
            <Switch
              id="schedule-toggle"
              checked={enabled}
              onCheckedChange={setEnabled}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!enabled ? (
          <div className="text-center py-4">
            <Calendar className="w-8 h-8 mx-auto mb-2" style={{ color: '#30363d' }} />
            <p className="text-xs" style={{ color: '#8b949e' }}>
              Enable automatic deployments on a schedule
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <Label className="text-xs" style={{ color: '#8b949e' }}>Frequency</Label>
              <Select value={selectedPreset} onValueChange={handlePresetChange}>
                <SelectTrigger className="bg-[#0d1117] border-[#30363d] text-[#c9d1d9] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#161b22] border-[#30363d]">
                  {PRESET_CRONS.map((preset) => (
                    <SelectItem key={preset.value} value={preset.value} className="text-xs text-[#c9d1d9]">
                      {preset.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedPreset === 'custom' && (
              <div className="space-y-2">
                <Label className="text-xs" style={{ color: '#8b949e' }}>Cron Expression</Label>
                <Input
                  value={customCron}
                  onChange={(e) => {
                    setCustomCron(e.target.value);
                    setCron(e.target.value);
                  }}
                  placeholder="0 0 9 * * ?"
                  className="bg-[#0d1117] border-[#30363d] text-[#c9d1d9] font-mono text-xs"
                />
                <p className="text-[10px]" style={{ color: '#484f58' }}>
                  Format: second minute hour day month weekday
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-xs" style={{ color: '#8b949e' }}>Timezone</Label>
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger className="bg-[#0d1117] border-[#30363d] text-[#c9d1d9] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#161b22] border-[#30363d]">
                  {TIMEZONES.map((tz) => (
                    <SelectItem key={tz} value={tz} className="text-xs text-[#c9d1d9]">
                      {tz}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Schedule Preview */}
            <div className="p-3 rounded-lg" style={{ backgroundColor: '#0d1117' }}>
              <p className="text-[10px] uppercase font-medium mb-1.5" style={{ color: '#58a6ff' }}>Schedule Preview</p>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: '#8b949e' }}>Cron</span>
                  <code className="text-xs font-mono" style={{ color: '#c9d1d9' }}>{cron}</code>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: '#8b949e' }}>Timezone</span>
                  <code className="text-xs font-mono" style={{ color: '#c9d1d9' }}>{timezone}</code>
                </div>
                {currentSchedule?.lastRun && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: '#8b949e' }}>Last Run</span>
                    <span className="text-xs" style={{ color: '#c9d1d9' }}>
                      {new Date(currentSchedule.lastRun).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Rate Limit Notice */}
            <div className="flex items-start gap-2 p-2.5 rounded-lg" style={{ backgroundColor: 'rgba(227,179,65,0.08)' }}>
              <Clock className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: '#e3b341' }} />
              <p className="text-[10px]" style={{ color: '#e3b341' }}>
                Scheduler respects GitHub API rate limits. If remaining requests &lt; 100, the run is deferred by 5 minutes.
              </p>
            </div>

            <Button
              className="w-full gap-2"
              size="sm"
              style={{ backgroundColor: '#238636', color: 'white' }}
              onClick={handleSave}
            >
              <Play className="w-3.5 h-3.5" /> Save Schedule
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

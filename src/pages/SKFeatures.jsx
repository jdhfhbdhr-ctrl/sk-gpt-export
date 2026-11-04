
import React, { useState } from "react";
import { SK_FEATURES, getFeatureSettings, saveFeatureSettings } from "@/lib/skFeatures";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

export default function SKFeatures() {
  const [settings, setSettings] = useState(getFeatureSettings);

  const toggle = (id, enabled) => {
    const next = { ...settings, [id]: enabled };
    setSettings(next);
    saveFeatureSettings(next);
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-3xl px-5 py-8">
        <div className="flex items-center gap-3">
          <Sparkles className="text-primary" size={28} />
          <div>
            <h1 className="text-3xl font-semibold">SK GPT Special Features</h1>
            <p className="text-sm text-muted-foreground">Your 12 signature SK GPT features.</p>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {SK_FEATURES.map((feature, index) => {
            const enabled = settings[feature.id] !== false;
            return (
              <Card key={feature.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base">
                      {index + 1}. {feature.name}
                    </CardTitle>
                    <Switch checked={enabled} onCheckedChange={(value) => toggle(feature.id, value)} />
                  </div>
                  <p className="text-xs text-primary">{feature.category}</p>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                  <p className="mt-3 text-xs">{enabled ? "Enabled" : "Disabled"}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

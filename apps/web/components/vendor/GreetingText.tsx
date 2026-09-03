"use client";

import { useEffect, useState } from "react";

/**
 * P-A round 66 — LOCAL-clock greeting.
 * Server components cannot know the visitor's timezone (they run in UTC);
 * this client component computes the greeting from the visitor's clock so
 * Lagos users see the right time of day. Server renders "Good day" first.
 */
export function GreetingText({ name }: { name: string }) {
  const [greeting, setGreeting] = useState("Good day");
  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening");
  }, []);
  return (
    <>
      {greeting}, {name}
    </>
  );
}

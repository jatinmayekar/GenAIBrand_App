"use client"

import * as React from "react"
import { Heart } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"

export function AuthorInfo() {
  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button 
              variant="ghost"
              className="w-10 h-10 p-0 hover:bg-transparent"
            >
              <Heart className="h-4 w-4" />
              <span className="sr-only">About the author</span>
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="right">About the author</TooltipContent>
      </Tooltip>
      <PopoverContent 
        className="w-80 p-4 author-info-popover"
        style={{
          backgroundColor: 'hsl(var(--background))',
          backdropFilter: 'none'
        }}
        side="right"
      >
        <div className="space-y-4">
          <h4 className="font-medium leading-none">About the Author</h4>
          <p className="text-sm text-muted-foreground">
            Hi! I&apos;m Jatin Mayekar, a developer exploring the future of human-computer interaction through natural language interfaces.
          </p>
          <p className="text-sm text-muted-foreground">
            Calie is part of my journey in creating intuitive calendar experiences where users can interact naturally with their schedules.
          </p>
          <p className="text-sm text-muted-foreground">
            I&apos;m passionate about making technology more accessible and human-centric through natural language processing.
          </p>
          <div className="border-t pt-4">
            <p className="text-sm font-medium">Thank you for being part of this journey!</p>
            <p className="text-xs text-muted-foreground mt-1">
              If you&apos;d like to support this project:
            </p>
            <a 
              href="https://buymeacoffee.com/jatinmayekar" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-block mt-2 text-sm text-blue-500 hover:text-blue-600"
            >
              ☕ Buy me a coffee
            </a>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
} 
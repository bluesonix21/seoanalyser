#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Theme Manager for NovaSEO Dashboard
-----------------------------------

Manages theme loading, switching, and provides theme-related utilities.
"""

import os
import json
from typing import Dict, Any
from PyQt6.QtCore import QObject, pyqtSignal


class ThemeManager(QObject):
    """
    Manages application themes and provides access to theme properties.
    Implements a singleton pattern to ensure only one theme manager exists.
    """
    
    # Singleton instance
    _instance = None
    
    # Signal emitted when theme changes
    signal_changed = pyqtSignal(str, object)
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(ThemeManager, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance
    
    def __init__(self):
        if self._initialized:
            return
        
        super().__init__()
        self._initialized = True
        
        # Load theme definitions
        self.themes = {}
        self.current_theme_name = "cyber"  # Default theme
        self._load_themes()
    
    def _load_themes(self):
        """Load all theme definitions from the JSON file."""
        theme_path = os.path.join(os.path.dirname(__file__), "themes.json")
        
        try:
            with open(theme_path, "r", encoding="utf-8") as f:
                self.themes = json.load(f)
        except (FileNotFoundError, json.JSONDecodeError) as e:
            print(f"Error loading themes: {e}")
            # Fallback to default theme
            self.themes = {
                "cyber": self._get_default_cyber_theme()
            }
    
    def _get_default_cyber_theme(self) -> Dict[str, Any]:
        """Return the default cyber theme as a fallback."""
        return {
            "name": "Cyber",
            "accent_color": "#9d4edd",
            "hover_accent_color": "#c77dff",
            "secondary_color": "#5390d9",
            "main": {
                "bg_color": "#121212",
                "text_color": "#e0e0e0",
                "title_color": "#ffffff",
            },
            "sidebar": {
                "bg_color": "#1a1a1a",
                "title_color": "#9d4edd",
                "text_color": "#e0e0e0",
                "hover_color": "#333333",
                "active_color": "#9d4edd33",  # Semi-transparent accent
                "active_text_color": "#ffffff",
                "border_color": "#333333",
                "icon_color": "#9d4edd",
                "glow_color": "#9d4edd80",  # Semi-transparent accent
                "version_color": "#666666"
            },
            "tabs": {
                "bg_color": "#1a1a1a",
                "text_color": "#e0e0e0",
                "hover_color": "#333333",
                "active_bg_color": "#242424",
                "active_text_color": "#ffffff",
                "close_hover_color": "#ff000033"  # Semi-transparent red
            },
            "cards": {
                "bg_color": "#242424",
                "title_color": "#ffffff",
                "text_color": "#e0e0e0",
                "border_color": "#333333",
                "icon_color": "#9d4edd",
                "chart_bg_color": "#1a1a1a",
                "shadow_color": "#00000080"  # Semi-transparent black
            },
            "chat": {
                "bg_color": "#1a1a1a",
                "title_color": "#ffffff",
                "input_bg_color": "#242424",
                "input_field_color": "#333333",
                "input_text_color": "#e0e0e0",
                "input_border_color": "#444444",
                "button_icon_color": "#ffffff",
                "user_bubble_color": "#9d4edd33",  # Semi-transparent accent
                "user_text_color": "#ffffff",
                "user_border_color": "#9d4edd",
                "ai_bubble_color": "#333333",
                "ai_text_color": "#e0e0e0",
                "ai_border_color": "#444444"
            },
            "settings": {
                "title_color": "#ffffff",
                "section_bg_color": "#242424",
                "section_title_color": "#ffffff",
                "text_color": "#e0e0e0",
                "border_color": "#333333",
                "control_border_color": "#666666"
            },
            "help": {
                "title_color": "#ffffff",
                "section_bg_color": "#242424",
                "section_title_color": "#ffffff",
                "text_color": "#e0e0e0",
                "border_color": "#333333"
            }
        }
    
    @property
    def current_theme(self) -> Dict[str, Any]:
        """Get the current theme dictionary."""
        return self.themes.get(self.current_theme_name, self._get_default_cyber_theme())
    
    def set_theme(self, theme_name: str) -> bool:
        """
        Change the current theme.
        
        Args:
            theme_name: The name of the theme to set
            
        Returns:
            bool: True if theme was changed, False otherwise
        """
        if theme_name not in self.themes:
            print(f"Theme '{theme_name}' not found")
            return False
        
        if theme_name == self.current_theme_name:
            return False  # No change needed
        
        self.current_theme_name = theme_name
        self.signal_changed.emit("theme", self.current_theme)
        return True
    
    def get_theme_color(self, color_key: str) -> str:
        """
        Get a specific color from the current theme.
        
        Args:
            color_key: The key path to the color (e.g., 'sidebar.bg_color')
            
        Returns:
            str: The color value or a default color if not found
        """
        theme = self.current_theme
        keys = color_key.split('.')
        
        for key in keys:
            if isinstance(theme, dict) and key in theme:
                theme = theme[key]
            else:
                return "#9d4edd"  # Default accent color
        
        return theme if isinstance(theme, str) else "#9d4edd"

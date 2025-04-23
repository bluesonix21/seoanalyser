#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Localization Manager for NovaSEO Dashboard
------------------------------------------

Manages language loading, switching, and provides localization-related utilities.
"""

import os
import json
from typing import Dict, Any, Optional
from PyQt6.QtCore import QObject, pyqtSignal


class LocalizationManager(QObject):
    """
    Manages application languages and provides access to translations.
    Implements a singleton pattern to ensure only one localization manager exists.
    """
    
    # Singleton instance
    _instance = None
    
    # Signal emitted when language changes
    signal_changed = pyqtSignal(str, object)
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(LocalizationManager, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance
    
    def __init__(self):
        if self._initialized:
            return
        
        super().__init__()
        self._initialized = True
        
        # Available languages
        self.available_languages = ["en", "tr", "ar", "ru", "cn"]
        
        # RTL languages
        self.rtl_languages = ["ar"]
        
        # Load language definitions
        self.languages = {}
        self.current_language_code = "en"  # Default language
        self._load_languages()
    
    def _load_languages(self):
        """Load all language definitions from the JSON files."""
        base_path = os.path.dirname(__file__)
        
        for lang_code in self.available_languages:
            lang_path = os.path.join(base_path, f"{lang_code}.json")
            
            try:
                with open(lang_path, "r", encoding="utf-8") as f:
                    self.languages[lang_code] = json.load(f)
            except (FileNotFoundError, json.JSONDecodeError) as e:
                print(f"Error loading language '{lang_code}': {e}")
                # Create an empty dictionary for missing languages
                self.languages[lang_code] = {}
    
    @property
    def current_language(self) -> Dict[str, Any]:
        """Get the current language dictionary."""
        return self.languages.get(self.current_language_code, {})
    
    @property
    def is_rtl(self) -> bool:
        """Check if the current language is right-to-left."""
        return self.current_language_code in self.rtl_languages
    
    def set_language(self, lang_code: str) -> bool:
        """
        Change the current language.
        
        Args:
            lang_code: The code of the language to set
            
        Returns:
            bool: True if language was changed, False otherwise
        """
        if lang_code not in self.available_languages:
            print(f"Language '{lang_code}' not available")
            return False
        
        if lang_code == self.current_language_code:
            return False  # No change needed
        
        self.current_language_code = lang_code
        self.signal_changed.emit("language", self.current_language)
        return True
    
    def get_text(self, key: str, default: Optional[str] = None) -> str:
        """
        Get a translated text by key.
        
        Args:
            key: The key path to the text (e.g., 'dashboard.title')
            default: Default text to return if key not found
            
        Returns:
            str: The translated text or the default if not found
        """
        return self.current_language.get(key, default or key)

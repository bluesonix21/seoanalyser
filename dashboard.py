#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
NovaSEO Dashboard
-----------------

A futuristic PyQt6-based dashboard for SEO and backlink analysis with 
multi-theme and multi-language support.

Features:
- Futuristic/cyberpunk design
- Sidebar menu with animated highlights
- Dynamic tab system
- Interactive dashboard cards
- 5 themes & 5 languages support
- Hardware-accelerated rendering
"""

import os
import sys
import json
from typing import Dict, List, Optional, Tuple, Union
import random

# PyQt imports
from PyQt6.QtWidgets import (
    QApplication, QMainWindow, QWidget, QVBoxLayout, QHBoxLayout,
    QLabel, QPushButton, QFrame, QScrollArea, QStackedWidget,
    QSplitter, QSpacerItem, QSizePolicy, QToolButton, QLineEdit, 
    QTextEdit, QTabWidget, QTabBar, QGraphicsDropShadowEffect,
    QCheckBox, QComboBox, QRadioButton, QSlider
)
from PyQt6.QtCore import (
    Qt, QSize, QRect, QPoint, QPropertyAnimation, 
    QEasingCurve, QTimer, QEvent, QObject, pyqtSignal, 
    pyqtProperty, pyqtSlot, QThread, QUrl
)
from PyQt6.QtGui import (
    QIcon, QPixmap, QFont, QColor, QPalette, QLinearGradient, 
    QPainter, QPen, QBrush, QPainterPath, QCursor, QFontDatabase,
    QMovie, QTransform, QPolygon, QImage, QResizeEvent, QKeyEvent
)
from PyQt6.QtSvg import QSvgRenderer

# Import resources
from resources.themes.theme_manager import ThemeManager
from resources.localization.localization_manager import LocalizationManager
from resources.icons.icons import IconProvider

# Constants
APP_NAME = "NovaSEO"
VERSION = "1.0.0"
DEFAULT_THEME = "cyber"
DEFAULT_LANGUAGE = "en"

class ObservableObject(QObject):
    """
    Base class for objects that can be observed for changes.
    Implements the Observer pattern.
    """
    signal_changed = pyqtSignal(str, object)
    
    def __init__(self):
        super().__init__()
        self._observers = []
    
    def add_observer(self, callback):
        """Add an observer callback."""
        if callback not in self._observers:
            self._observers.append(callback)
    
    def remove_observer(self, callback):
        """Remove an observer callback."""
        if callback in self._observers:
            self._observers.remove(callback)
    
    def notify_observers(self, property_name, value):
        """Notify all observers of a property change."""
        self.signal_changed.emit(property_name, value)
        for callback in self._observers:
            callback(property_name, value)


class SidebarButton(QPushButton):
    """Custom button for the sidebar with hover and active states."""
    
    def __init__(self, icon_name, text, parent=None):
        super().__init__(parent)
        self.icon_name = icon_name
        self.text = text
        self.active = False
        self.theme_manager = ThemeManager()
        
        # Initial setup
        self.setCursor(QCursor(Qt.CursorShape.PointingHandCursor))
        self.setCheckable(True)
        self.setFixedHeight(50)
        self.setIconSize(QSize(24, 24))
        
        # Connect to theme changes
        self.theme_manager.signal_changed.connect(self.update_styling)
        
        # Set up initial styling
        self.update_styling()
    
    def update_styling(self, *args):
        """Update button styling based on current theme."""
        theme = self.theme_manager.current_theme
        
        # Base style
        button_style = f"""
            SidebarButton {{
                border: none;
                border-radius: 5px;
                padding: 10px;
                text-align: left;
                font-size: 14px;
                font-weight: 500;
                color: {theme['sidebar']['text_color']};
                background-color: transparent;
            }}
            
            SidebarButton:hover {{
                background-color: {theme['sidebar']['hover_color']};
            }}
            
            SidebarButton:checked {{
                background-color: {theme['sidebar']['active_color']};
                color: {theme['sidebar']['active_text_color']};
            }}
        """
        self.setStyleSheet(button_style)
        
        # Update icon with theme color
        icon = IconProvider.get_themed_icon(self.icon_name, theme['sidebar']['icon_color'])
        self.setIcon(icon)
        self.setText(self.text)
    
    def setActive(self, active):
        """Set the active state of the button."""
        self.active = active
        self.setChecked(active)
        if active:
            # Add glow effect if active
            shadow = QGraphicsDropShadowEffect(self)
            theme = self.theme_manager.current_theme
            glow_color = QColor(theme['sidebar']['glow_color'])
            shadow.setColor(glow_color)
            shadow.setBlurRadius(15)
            shadow.setOffset(0, 0)
            self.setGraphicsEffect(shadow)
        else:
            self.setGraphicsEffect(None)


class TabWidget(QTabWidget):
    """Custom tab widget with draggable tabs and theme support."""
    
    def __init__(self, parent=None):
        super().__init__(parent)
        self.theme_manager = ThemeManager()
        
        # Initial setup
        self.setTabsClosable(True)
        self.setMovable(True)
        self.setDocumentMode(True)
        
        # Tab bar customization
        self.tab_bar = self.tabBar()
        self.tab_bar.setExpanding(False)
        self.tab_bar.setDrawBase(False)
        
        # Connect signals
        self.tabCloseRequested.connect(self.close_tab)
        self.theme_manager.signal_changed.connect(self.update_styling)
        
        # Set up initial styling
        self.update_styling()
    
    def update_styling(self, *args):
        """Update tab widget styling based on current theme."""
        theme = self.theme_manager.current_theme
        
        # Tab widget style
        tab_style = f"""
            QTabWidget::pane {{
                border: none;
                background-color: {theme['main']['bg_color']};
            }}
            
            QTabBar::tab {{
                background-color: {theme['tabs']['bg_color']};
                color: {theme['tabs']['text_color']};
                padding: 8px 16px;
                border-top-left-radius: 4px;
                border-top-right-radius: 4px;
                margin-right: 2px;
                border-bottom: 2px solid transparent;
            }}
            
            QTabBar::tab:hover {{
                background-color: {theme['tabs']['hover_color']};
            }}
            
            QTabBar::tab:selected {{
                background-color: {theme['tabs']['active_bg_color']};
                color: {theme['tabs']['active_text_color']};
                border-bottom: 2px solid {theme['accent_color']};
            }}
            
            QTabBar::close-button {{
                image: url(resources/icons/close.svg);
                subcontrol-position: right;
            }}
            
            QTabBar::close-button:hover {{
                background-color: {theme['tabs']['close_hover_color']};
                border-radius: 2px;
            }}
        """
        self.setStyleSheet(tab_style)
    
    def add_tab(self, widget, title, icon_name=None):
        """Add a new tab with an optional icon."""
        if icon_name:
            icon = IconProvider.get_themed_icon(icon_name, self.theme_manager.current_theme['accent_color'])
            return super().addTab(widget, icon, title)
        else:
            return super().addTab(widget, title)
    
    def close_tab(self, index):
        """Close a tab by index."""
        # Don't close the first tab (Home)
        if index > 0:
            self.removeTab(index)


class DashboardCard(QFrame):
    """Interactive card for the dashboard with hover effects and custom styling."""
    
    clicked = pyqtSignal(str)
    
    def __init__(self, title, description, icon_name, card_type, chart_data=None, parent=None):
        super().__init__(parent)
        self.title = title
        self.description = description
        self.icon_name = icon_name
        self.card_type = card_type
        self.chart_data = chart_data
        self.hovered = False
        
        self.theme_manager = ThemeManager()
        self.loc_manager = LocalizationManager()
        
        # Card layout
        self.layout = QVBoxLayout(self)
        self.layout.setContentsMargins(20, 20, 20, 20)
        self.layout.setSpacing(10)
        
        # Title with icon
        self.title_layout = QHBoxLayout()
        self.icon_label = QLabel()
        self.icon_label.setFixedSize(QSize(32, 32))
        self.title_label = QLabel(title)
        self.title_label.setObjectName("card_title")
        
        self.title_layout.addWidget(self.icon_label)
        self.title_layout.addWidget(self.title_label)
        self.title_layout.addStretch()
        
        # Description
        self.desc_label = QLabel(description)
        self.desc_label.setObjectName("card_description")
        self.desc_label.setWordWrap(True)
        
        # Chart area (placeholder)
        self.chart_area = QFrame()
        self.chart_area.setMinimumHeight(80)
        self.chart_area.setObjectName("chart_area")
        
        # Add to main layout
        self.layout.addLayout(self.title_layout)
        self.layout.addWidget(self.desc_label)
        self.layout.addWidget(self.chart_area)
        self.layout.addStretch()
        
        # Style and effects
        self.setFrameShape(QFrame.Shape.StyledPanel)
        self.setLineWidth(0)
        self.setCursor(QCursor(Qt.CursorShape.PointingHandCursor))
        
        # Add drop shadow
        self.shadow = QGraphicsDropShadowEffect(self)
        self.shadow.setBlurRadius(15)
        self.shadow.setOffset(0, 5)
        self.setGraphicsEffect(self.shadow)
        
        # Set up initial styling
        self.update_styling()
        self.update_translation()
        
        # Connect signals
        self.theme_manager.signal_changed.connect(self.update_styling)
        self.loc_manager.signal_changed.connect(self.update_translation)
    
    def update_styling(self, *args):
        """Update card styling based on current theme."""
        theme = self.theme_manager.current_theme
        
        # Card style
        style = f"""
            DashboardCard {{
                background-color: {theme['cards']['bg_color']};
                border-radius: 10px;
                border: 1px solid {theme['cards']['border_color']};
            }}
            
            #card_title {{
                color: {theme['cards']['title_color']};
                font-size: 16px;
                font-weight: bold;
            }}
            
            #card_description {{
                color: {theme['cards']['text_color']};
                font-size: 14px;
            }}
            
            #chart_area {{
                background-color: {theme['cards']['chart_bg_color']};
                border-radius: 5px;
            }}
        """
        self.setStyleSheet(style)
        
        # Update icon with theme color
        icon = IconProvider.get_themed_icon(self.icon_name, theme['cards']['icon_color'])
        pixmap = icon.pixmap(QSize(32, 32))
        self.icon_label.setPixmap(pixmap)
        
        # Update shadow color
        shadow_color = QColor(theme['cards']['shadow_color'])
        shadow_color.setAlpha(100)
        self.shadow.setColor(shadow_color)
    
    def update_translation(self, *args):
        """Update card text based on current language."""
        lang = self.loc_manager.current_language
        card_key = f"dashboard.cards.{self.card_type}"
        
        # Update title and description with translated text
        self.title_label.setText(lang.get(f"{card_key}.title", self.title))
        self.desc_label.setText(lang.get(f"{card_key}.description", self.description))
    
    def paintEvent(self, event):
        """Custom paint event to handle hover effects."""
        super().paintEvent(event)
        
        if self.hovered:
            # Draw a subtle highlight border when hovered
            painter = QPainter(self)
            painter.setRenderHint(QPainter.RenderHint.Antialiasing)
            
            theme = self.theme_manager.current_theme
            highlight_color = QColor(theme['accent_color'])
            highlight_color.setAlpha(100)
            
            pen = QPen(highlight_color)
            pen.setWidth(2)
            painter.setPen(pen)
            
            path = QPainterPath()
            rect = self.rect().adjusted(1, 1, -1, -1)
            path.addRoundedRect(rect, 10, 10)
            painter.drawPath(path)
    
    def enterEvent(self, event):
        """Handle mouse enter event."""
        self.hovered = True
        
        # Increase shadow on hover
        self.shadow.setBlurRadius(25)
        self.shadow.setOffset(0, 8)
        
        self.update()
    
    def leaveEvent(self, event):
        """Handle mouse leave event."""
        self.hovered = False
        
        # Reset shadow
        self.shadow.setBlurRadius(15)
        self.shadow.setOffset(0, 5)
        
        self.update()
    
    def mousePressEvent(self, event):
        """Handle mouse press event."""
        if event.button() == Qt.MouseButton.LeftButton:
            # Emit clicked signal with card type
            self.clicked.emit(self.card_type)
        super().mousePressEvent(event)


class ChatMessage(QFrame):
    """A chat message widget for the AI interface."""
    
    def __init__(self, message, is_user=False, parent=None):
        super().__init__(parent)
        self.message = message
        self.is_user = is_user
        self.theme_manager = ThemeManager()
        
        # Setup layout
        self.layout = QHBoxLayout(self)
        self.layout.setContentsMargins(10, 10, 10, 10)
        
        # Create message bubble
        self.message_bubble = QFrame()
        self.message_bubble.setObjectName("message_bubble")
        self.bubble_layout = QVBoxLayout(self.message_bubble)
        
        # Message text
        self.message_label = QLabel(message)
        self.message_label.setWordWrap(True)
        self.message_label.setTextFormat(Qt.TextFormat.RichText)
        self.bubble_layout.addWidget(self.message_label)
        
        # Add avatar and message in correct order based on who sent it
        if is_user:
            self.layout.addStretch()
            self.layout.addWidget(self.message_bubble)
            avatar_icon = IconProvider.get_themed_icon("user", self.theme_manager.current_theme['accent_color'])
        else:
            avatar_icon = IconProvider.get_themed_icon("robot", self.theme_manager.current_theme['secondary_color'])
            self.layout.addWidget(self.message_bubble)
            self.layout.addStretch()
        
        # Connect signals
        self.theme_manager.signal_changed.connect(self.update_styling)
        
        # Initial styling
        self.update_styling()
    
    def update_styling(self, *args):
        """Update message styling based on current theme."""
        theme = self.theme_manager.current_theme
        
        # Different styling for user and AI messages
        if self.is_user:
            bubble_bg = theme['chat']['user_bubble_color']
            text_color = theme['chat']['user_text_color']
            border_color = theme['chat']['user_border_color']
            align = "right"
        else:
            bubble_bg = theme['chat']['ai_bubble_color']
            text_color = theme['chat']['ai_text_color']
            border_color = theme['chat']['ai_border_color']
            align = "left"
        
        # Apply styles
        self.message_bubble.setStyleSheet(f"""
            #message_bubble {{
                background-color: {bubble_bg};
                border: 1px solid {border_color};
                border-radius: 15px;
                padding: 10px;
            }}
            
            QLabel {{
                color: {text_color};
                font-size: 14px;
                text-align: {align};
            }}
        """)
        
        # Set maximum width
        self.message_bubble.setMaximumWidth(400)


class AIChat(QWidget):
    """AI Chat interface for interacting with the AI assistant."""
    
    def __init__(self, parent=None):
        super().__init__(parent)
        self.theme_manager = ThemeManager()
        self.loc_manager = LocalizationManager()
        
        # Main layout
        self.layout = QVBoxLayout(self)
        self.layout.setContentsMargins(20, 20, 20, 20)
        self.layout.setSpacing(20)
        
        # Chat title
        self.title_label = QLabel("Nova AI Assistant")
        self.title_label.setObjectName("chat_title")
        self.title_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        
        # Chat message area with scroll
        self.scroll_area = QScrollArea()
        self.scroll_area.setWidgetResizable(True)
        self.scroll_area.setHorizontalScrollBarPolicy(Qt.ScrollBarPolicy.ScrollBarAlwaysOff)
        self.scroll_area.setFrameShape(QFrame.Shape.NoFrame)
        
        self.chat_container = QWidget()
        self.chat_layout = QVBoxLayout(self.chat_container)
        self.chat_layout.setSpacing(15)
        self.chat_layout.addStretch()
        
        self.scroll_area.setWidget(self.chat_container)
        
        # Input area
        self.input_frame = QFrame()
        self.input_frame.setObjectName("input_frame")
        self.input_layout = QHBoxLayout(self.input_frame)
        
        self.chat_input = QTextEdit()
        self.chat_input.setObjectName("chat_input")
        self.chat_input.setPlaceholderText("Type your message here...")
        self.chat_input.setAcceptRichText(False)
        self.chat_input.setMaximumHeight(100)
        
        self.send_button = QPushButton()
        self.send_button.setObjectName("send_button")
        self.send_button.setFixedSize(QSize(40, 40))
        self.send_button.setCursor(QCursor(Qt.CursorShape.PointingHandCursor))
        self.send_button.clicked.connect(self.send_message)
        
        self.input_layout.addWidget(self.chat_input)
        self.input_layout.addWidget(self.send_button)
        
        # Add all components to main layout
        self.layout.addWidget(self.title_label)
        self.layout.addWidget(self.scroll_area)
        self.layout.addWidget(self.input_frame)
        
        # Connect signals
        self.theme_manager.signal_changed.connect(self.update_styling)
        self.loc_manager.signal_changed.connect(self.update_translation)
        
        # Initial setup
        self.update_styling()
        self.update_translation()
        
        # Add welcome message
        self.add_message("Welcome to the NovaSEO AI Assistant! How can I help you today?", False)
    
    def update_styling(self, *args):
        """Update chat styling based on current theme."""
        theme = self.theme_manager.current_theme
        
        # Chat styles
        style = f"""
            #chat_title {{
                color: {theme['chat']['title_color']};
                font-size: 22px;
                font-weight: bold;
                margin-bottom: 10px;
            }}
            
            QScrollArea {{
                background-color: {theme['chat']['bg_color']};
                border-radius: 10px;
            }}
            
            #input_frame {{
                background-color: {theme['chat']['input_bg_color']};
                border-radius: 10px;
                padding: 5px;
            }}
            
            #chat_input {{
                background-color: {theme['chat']['input_field_color']};
                color: {theme['chat']['input_text_color']};
                border-radius: 5px;
                padding: 10px;
                font-size: 14px;
                border: 1px solid {theme['chat']['input_border_color']};
            }}
            
            #send_button {{
                background-color: {theme['accent_color']};
                border-radius: 20px;
                border: none;
            }}
            
            #send_button:hover {{
                background-color: {theme['hover_accent_color']};
            }}
        """
        self.setStyleSheet(style)
        
        # Update send button icon
        send_icon = IconProvider.get_themed_icon("send", theme['chat']['button_icon_color'])
        self.send_button.setIcon(send_icon)
        self.send_button.setIconSize(QSize(20, 20))
    
    def update_translation(self, *args):
        """Update chat text based on current language."""
        lang = self.loc_manager.current_language
        
        # Update title and placeholder with translated text
        self.title_label.setText(lang.get("ai.title", "Nova AI Assistant"))
        self.chat_input.setPlaceholderText(lang.get("ai.input_placeholder", "Type your message here..."))
    
    def add_message(self, message, is_user=True):
        """Add a new message to the chat."""
        chat_message = ChatMessage(message, is_user, self)
        # Insert before the stretch at the end
        self.chat_layout.insertWidget(self.chat_layout.count() - 1, chat_message)
        
        # Scroll to bottom
        QTimer.singleShot(100, self.scroll_to_bottom)
    
    def scroll_to_bottom(self):
        """Scroll the chat area to the bottom."""
        scrollbar = self.scroll_area.verticalScrollBar()
        scrollbar.setValue(scrollbar.maximum())
    
    def send_message(self):
        """Send the current message in the input field."""
        message = self.chat_input.toPlainText().strip()
        if not message:
            return
        
        # Add user message
        self.add_message(message, True)
        
        # Clear input
        self.chat_input.clear()
        
        # Simulate AI response (theme test)
        self.simulate_ai_response(message)
    
    def simulate_ai_response(self, message):
        """Simulate an AI response for testing the theme."""
        # Generate a response about the current theme
        theme_name = self.theme_manager.current_theme_name
        language_name = self.loc_manager.current_language_code
        
        response = f"""
        I notice you're using the <b>{theme_name}</b> theme and <b>{language_name}</b> language.
        
        How do you like the color scheme? I can provide some analysis on your SEO settings if you'd like.
        """
        
        # Delayed response to simulate processing
        QTimer.singleShot(1000, lambda: self.add_message(response, False))


class SettingsPage(QWidget):
    """Settings page for customizing theme and language settings."""
    
    def __init__(self, parent=None):
        super().__init__(parent)
        self.theme_manager = ThemeManager()
        self.loc_manager = LocalizationManager()
        
        # Main layout
        self.layout = QVBoxLayout(self)
        self.layout.setContentsMargins(30, 30, 30, 30)
        self.layout.setSpacing(30)
        
        # Settings title
        self.title_label = QLabel("Settings")
        self.title_label.setObjectName("settings_title")
        
        # Theme section
        self.theme_frame = QFrame()
        self.theme_frame.setObjectName("settings_section")
        self.theme_layout = QVBoxLayout(self.theme_frame)
        
        self.theme_title = QLabel("Theme")
        self.theme_title.setObjectName("section_title")
        
        self.theme_options = QFrame()
        self.theme_options_layout = QHBoxLayout(self.theme_options)
        self.theme_options_layout.setSpacing(20)
        
        # Create theme buttons
        self.theme_buttons = {}
        theme_names = ["cyber", "matrix", "ocean", "blood", "royal"]
        
        for theme_name in theme_names:
            theme_button = QRadioButton(theme_name.capitalize())
            theme_button.setObjectName(f"theme_{theme_name}")
            theme_button.toggled.connect(lambda checked, name=theme_name: 
                                         self.change_theme(name) if checked else None)
            self.theme_buttons[theme_name] = theme_button
            self.theme_options_layout.addWidget(theme_button)
        
        # Set current theme button checked
        current_theme = self.theme_manager.current_theme_name
        if current_theme in self.theme_buttons:
            self.theme_buttons[current_theme].setChecked(True)
        
        self.theme_layout.addWidget(self.theme_title)
        self.theme_layout.addWidget(self.theme_options)
        
        # Language section
        self.lang_frame = QFrame()
        self.lang_frame.setObjectName("settings_section")
        self.lang_layout = QVBoxLayout(self.lang_frame)
        
        self.lang_title = QLabel("Language")
        self.lang_title.setObjectName("section_title")
        
        self.lang_options = QFrame()
        self.lang_options_layout = QHBoxLayout(self.lang_options)
        self.lang_options_layout.setSpacing(20)
        
        # Create language buttons
        self.lang_buttons = {}
        lang_data = [
            ("en", "English"),
            ("tr", "Türkçe"),
            ("ar", "العربية"),
            ("ru", "Русский"),
            ("cn", "中文")
        ]
        
        for lang_code, lang_name in lang_data:
            lang_button = QRadioButton(lang_name)
            lang_button.setObjectName(f"lang_{lang_code}")
            lang_button.toggled.connect(lambda checked, code=lang_code:
                                       self.change_language(code) if checked else None)
            self.lang_buttons[lang_code] = lang_button
            self.lang_options_layout.addWidget(lang_button)
        
        # Set current language button checked
        current_lang = self.loc_manager.current_language_code
        if current_lang in self.lang_buttons:
            self.lang_buttons[current_lang].setChecked(True)
        
        self.lang_layout.addWidget(self.lang_title)
        self.lang_layout.addWidget(self.lang_options)
        
        # Add all sections to main layout
        self.layout.addWidget(self.title_label)
        self.layout.addWidget(self.theme_frame)
        self.layout.addWidget(self.lang_frame)
        self.layout.addStretch()
        
        # Connect signals
        self.theme_manager.signal_changed.connect(self.update_styling)
        self.loc_manager.signal_changed.connect(self.update_translation)
        
        # Initial setup
        self.update_styling()
        self.update_translation()
    
    def update_styling(self, *args):
        """Update settings page styling based on current theme."""
        theme = self.theme_manager.current_theme
        
        # Settings styles
        style = f"""
            #settings_title {{
                color: {theme['settings']['title_color']};
                font-size: 24px;
                font-weight: bold;
                margin-bottom: 20px;
            }}
            
            #settings_section {{
                background-color: {theme['settings']['section_bg_color']};
                border-radius: 10px;
                padding: 20px;
                border: 1px solid {theme['settings']['border_color']};
            }}
            
            #section_title {{
                color: {theme['settings']['section_title_color']};
                font-size: 18px;
                font-weight: bold;
                margin-bottom: 15px;
            }}
            
            QRadioButton {{
                color: {theme['settings']['text_color']};
                font-size: 14px;
                spacing: 8px;
            }}
            
            QRadioButton::indicator {{
                width: 18px;
                height: 18px;
                border-radius: 9px;
                border: 2px solid {theme['settings']['control_border_color']};
            }}
            
            QRadioButton::indicator:checked {{
                background-color: {theme['accent_color']};
                border: 2px solid {theme['accent_color']};
            }}
            
            QRadioButton::indicator:unchecked:hover {{
                border: 2px solid {theme['accent_color']};
            }}
        """
        self.setStyleSheet(style)
        
        # Add visual indication for the current theme
        for theme_name, button in self.theme_buttons.items():
            # Add a preview color next to the theme name
            if theme_name == "cyber":
                color = "#9d4edd"  # Purple
            elif theme_name == "matrix":
                color = "#00ff41"  # Green
            elif theme_name == "ocean":
                color = "#0096c7"  # Blue
            elif theme_name == "blood":
                color = "#d00000"  # Red
            elif theme_name == "royal":
                color = "#d4af37"  # Gold
            
            button.setStyleSheet(button.styleSheet() + f"""
                QRadioButton {{
                    padding-left: 8px;
                    border-left: 3px solid {color};
                }}
            """)
    
    def update_translation(self, *args):
        """Update settings text based on current language."""
        lang = self.loc_manager.current_language
        
        # Update titles with translated text
        self.title_label.setText(lang.get("settings.title", "Settings"))
        self.theme_title.setText(lang.get("settings.theme", "Theme"))
        self.lang_title.setText(lang.get("settings.language", "Language"))
    
    def change_theme(self, theme_name):
        """Change the current theme."""
        self.theme_manager.set_theme(theme_name)
    
    def change_language(self, lang_code):
        """Change the current language."""
        self.loc_manager.set_language(lang_code)


class HelpPage(QWidget):
    """Help page with information about the application."""
    
    def __init__(self, parent=None):
        super().__init__(parent)
        self.theme_manager = ThemeManager()
        self.loc_manager = LocalizationManager()
        
        # Main layout
        self.layout = QVBoxLayout(self)
        self.layout.setContentsMargins(30, 30, 30, 30)
        self.layout.setSpacing(20)
        
        # Help title
        self.title_label = QLabel("Help & Documentation")
        self.title_label.setObjectName("help_title")
        
        # Help content
        self.help_scroll = QScrollArea()
        self.help_scroll.setWidgetResizable(True)
        self.help_scroll.setFrameShape(QFrame.Shape.NoFrame)
        
        self.help_content = QWidget()
        self.content_layout = QVBoxLayout(self.help_content)
        self.content_layout.setSpacing(20)
        
        # About section
        self.about_frame = QFrame()
        self.about_frame.setObjectName("help_section")
        self.about_layout = QVBoxLayout(self.about_frame)
        
        self.about_title = QLabel("About NovaSEO")
        self.about_title.setObjectName("section_title")
        
        self.about_text = QLabel(
            "NovaSEO is a powerful SEO and backlink analysis tool designed "
            "to help you optimize your website and improve your search engine rankings. "
            "With advanced features and a user-friendly interface, NovaSEO makes it easy "
            "to analyze your site's performance and identify opportunities for improvement."
        )
        self.about_text.setObjectName("help_text")
        self.about_text.setWordWrap(True)
        
        self.about_layout.addWidget(self.about_title)
        self.about_layout.addWidget(self.about_text)
        
        # Features section
        self.features_frame = QFrame()
        self.features_frame.setObjectName("help_section")
        self.features_layout = QVBoxLayout(self.features_frame)
        
        self.features_title = QLabel("Key Features")
        self.features_title.setObjectName("section_title")
        
        self.features_text = QLabel(
            "• Comprehensive SEO Analysis\n"
            "• Detailed Backlink Mapping\n"
            "• Competitor Analysis\n"
            "• Keyword Research\n"
            "• AI-Powered Recommendations\n"
            "• Performance Tracking\n"
            "• Custom Reports\n"
            "• Multi-Language Support"
        )
        self.features_text.setObjectName("help_text")
        
        self.features_layout.addWidget(self.features_title)
        self.features_layout.addWidget(self.features_text)
        
        # Add all sections to content layout
        self.content_layout.addWidget(self.about_frame)
        self.content_layout.addWidget(self.features_frame)
        self.content_layout.addStretch()
        
        self.help_scroll.setWidget(self.help_content)
        
        # Add all components to main layout
        self.layout.addWidget(self.title_label)
        self.layout.addWidget(self.help_scroll)
        
        # Connect signals
        self.theme_manager.signal_changed.connect(self.update_styling)
        self.loc_manager.signal_changed.connect(self.update_translation)
        
        # Initial setup
        self.update_styling()
        self.update_translation()
    
    def update_styling(self, *args):
        """Update help page styling based on current theme."""
        theme = self.theme_manager.current_theme
        
        # Help styles
        style = f"""
            #help_title {{
                color: {theme['help']['title_color']};
                font-size: 24px;
                font-weight: bold;
                margin-bottom: 20px;
            }}
            
            #help_section {{
                background-color: {theme['help']['section_bg_color']};
                border-radius: 10px;
                padding: 20px;
                border: 1px solid {theme['help']['border_color']};
            }}
            
            #section_title {{
                color: {theme['help']['section_title_color']};
                font-size: 18px;
                font-weight: bold;
                margin-bottom: 15px;
            }}
            
            #help_text {{
                color: {theme['help']['text_color']};
                font-size: 14px;
                line-height: 1.6;
            }}
        """
        self.setStyleSheet(style)
    
    def update_translation(self, *args):
        """Update help text based on current language."""
        lang = self.loc_manager.current_language
        
        # Update titles and content with translated text
        self.title_label.setText(lang.get("help.title", "Help & Documentation"))
        self.about_title.setText(lang.get("help.about.title", "About NovaSEO"))
        self.about_text.setText(lang.get("help.about.content", 
            "NovaSEO is a powerful SEO and backlink analysis tool designed "
            "to help you optimize your website and improve your search engine rankings. "
            "With advanced features and a user-friendly interface, NovaSEO makes it easy "
            "to analyze your site's performance and identify opportunities for improvement."
        ))
        
        self.features_title.setText(lang.get("help.features.title", "Key Features"))
        self.features_text.setText(lang.get("help.features.content",
            "• Comprehensive SEO Analysis\n"
            "• Detailed Backlink Mapping\n"
            "• Competitor Analysis\n"
            "• Keyword Research\n"
            "• AI-Powered Recommendations\n"
            "• Performance Tracking\n"
            "• Custom Reports\n"
            "• Multi-Language Support"
        ))


class Dashboard(QMainWindow):
    """Main dashboard window for NovaSEO application."""
    
    def __init__(self):
        super().__init__()
        # Initialize managers
        self.theme_manager = ThemeManager()
        self.loc_manager = LocalizationManager()
        
        # Setup window properties
        self.setWindowTitle(f"{APP_NAME} Dashboard")
        self.resize(1280, 720)
        self.setMinimumSize(1024, 700)
        
        # Create central widget and main layout
        self.central_widget = QWidget()
        self.setCentralWidget(self.central_widget)
        self.main_layout = QHBoxLayout(self.central_widget)
        self.main_layout.setContentsMargins(0, 0, 0, 0)
        self.main_layout.setSpacing(0)
        
        # Create sidebar
        self.create_sidebar()
        
        # Create main content area
        self.create_content_area()
        
        # Create pages
        self.create_dashboard_page()
        self.create_ai_page()
        self.create_settings_page()
        self.create_help_page()
        
        # Add initial home tab
        self.tab_widget.add_tab(self.dashboard_page, "Dashboard", "home")
        
        # Connect signals
        self.theme_manager.signal_changed.connect(self.update_styling)
        self.loc_manager.signal_changed.connect(self.update_translation)
        
        # Initial setup
        self.update_styling()
        self.update_translation()
        
        # Set home button as active
        self.sidebar_buttons["home"].setActive(True)
    
    def create_sidebar(self):
        """Create the sidebar with navigation buttons."""
        # Sidebar container
        self.sidebar = QFrame()
        self.sidebar.setObjectName("sidebar")
        self.sidebar.setFixedWidth(200)
        
        # Sidebar layout
        self.sidebar_layout = QVBoxLayout(self.sidebar)
        self.sidebar_layout.setContentsMargins(10, 20, 10, 20)
        self.sidebar_layout.setSpacing(10)
        
        # App title
        self.app_title = QLabel(APP_NAME)
        self.app_title.setObjectName("app_title")
        self.app_title.setAlignment(Qt.AlignmentFlag.AlignCenter)
        
        # Sidebar buttons
        self.sidebar_buttons = {}
        
        # Home button
        self.home_button = SidebarButton("home", "Dashboard", self)
        self.home_button.clicked.connect(lambda: self.switch_page("home"))
        self.sidebar_buttons["home"] = self.home_button
        
        # AI button
        self.ai_button = SidebarButton("robot", "AI Assistant", self)
        self.ai_button.clicked.connect(lambda: self.switch_page("ai"))
        self.sidebar_buttons["ai"] = self.ai_button
        
        # Settings button
        self.settings_button = SidebarButton("settings", "Settings", self)
        self.settings_button.clicked.connect(lambda: self.switch_page("settings"))
        self.sidebar_buttons["settings"] = self.settings_button
        
        # Help button
        self.help_button = SidebarButton("help", "Help", self)
        self.help_button.clicked.connect(lambda: self.switch_page("help"))
        self.sidebar_buttons["help"] = self.help_button
        
        # Add version at bottom
        self.version_label = QLabel(f"v{VERSION}")
        self.version_label.setObjectName("version_label")
        self.version_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        
        # Add widgets to sidebar layout
        self.sidebar_layout.addWidget(self.app_title)
        self.sidebar_layout.addSpacing(20)
        self.sidebar_layout.addWidget(self.home_button)
        self.sidebar_layout.addWidget(self.ai_button)
        self.sidebar_layout.addWidget(self.settings_button)
        self.sidebar_layout.addWidget(self.help_button)
        self.sidebar_layout.addStretch()
        self.sidebar_layout.addWidget(self.version_label)
        
        # Add sidebar to main layout
        self.main_layout.addWidget(self.sidebar)
    
    def create_content_area(self):
        """Create the main content area with tab widget."""
        # Content container
        self.content_area = QFrame()
        self.content_area.setObjectName("content_area")
        
        # Content layout
        self.content_layout = QVBoxLayout(self.content_area)
        self.content_layout.setContentsMargins(0, 0, 0, 0)
        self.content_layout.setSpacing(0)
        
        # Tab widget for multiple pages
        self.tab_widget = TabWidget()
        self.tab_widget.currentChanged.connect(self.handle_tab_change)
        
        # Add tab widget to content layout
        self.content_layout.addWidget(self.tab_widget)
        
        # Add content area to main layout
        self.main_layout.addWidget(self.content_area)
    
    def create_dashboard_page(self):
        """Create the main dashboard page with cards."""
        self.dashboard_page = QWidget()
        self.dashboard_layout = QVBoxLayout(self.dashboard_page)
        self.dashboard_layout.setContentsMargins(30, 30, 30, 30)
        self.dashboard_layout.setSpacing(20)
        
        # Dashboard title
        self.dashboard_title = QLabel("Dashboard")
        self.dashboard_title.setObjectName("page_title")
        
        # Cards grid layout
        self.cards_container = QWidget()
        self.cards_grid = QHBoxLayout(self.cards_container)
        self.cards_grid.setContentsMargins(0, 0, 0, 0)
        self.cards_grid.setSpacing(20)
        
        # Left column
        self.left_column = QVBoxLayout()
        self.left_column.setSpacing(20)
        
        # Right column
        self.right_column = QVBoxLayout()
        self.right_column.setSpacing(20)
        
        # Create dashboard cards
        self.cards = {}
        
        # SEO Score card
        self.seo_card = DashboardCard(
            "SEO Score", 
            "Analyze your website's SEO performance", 
            "chart-line", 
            "seo_score"
        )
        self.seo_card.clicked.connect(self.open_card_page)
        self.cards["seo_score"] = self.seo_card
        
        # Backlink Map card
        self.backlink_card = DashboardCard(
            "Backlink Map", 
            "Visualize your backlink profile", 
            "link", 
            "backlink_map"
        )
        self.backlink_card.clicked.connect(self.open_card_page)
        self.cards["backlink_map"] = self.backlink_card
        
        # Competitor Analysis card
        self.competitor_card = DashboardCard(
            "Competitor Analysis", 
            "Monitor and compare competitor websites", 
            "target", 
            "competitor_analysis"
        )
        self.competitor_card.clicked.connect(self.open_card_page)
        self.cards["competitor_analysis"] = self.competitor_card
        
        # Keyword Research card
        self.keyword_card = DashboardCard(
            "Keyword Research", 
            "Find high-performing keywords for your niche", 
            "search", 
            "keyword_research"
        )
        self.keyword_card.clicked.connect(self.open_card_page)
        self.cards["keyword_research"] = self.keyword_card
        
        # Performance Tracking card
        self.performance_card = DashboardCard(
            "Performance Tracking", 
            "Track your website's performance over time", 
            "activity", 
            "performance_tracking"
        )
        self.performance_card.clicked.connect(self.open_card_page)
        self.cards["performance_tracking"] = self.performance_card
        
        # Content Analysis card
        self.content_card = DashboardCard(
            "Content Analysis", 
            "Analyze your content for SEO opportunities", 
            "file-text", 
            "content_analysis"
        )
        self.content_card.clicked.connect(self.open_card_page)
        self.cards["content_analysis"] = self.content_card
        
        # Site Audit card
        self.audit_card = DashboardCard(
            "Site Audit", 
            "Identify and fix technical issues", 
            "tool", 
            "site_audit"
        )
        self.audit_card.clicked.connect(self.open_card_page)
        self.cards["site_audit"] = self.audit_card
        
        # Reports card
        self.reports_card = DashboardCard(
            "Reports", 
            "Generate custom SEO reports", 
            "file", 
            "reports"
        )
        self.reports_card.clicked.connect(self.open_card_page)
        self.cards["reports"] = self.reports_card
        
        # Add cards to columns
        self.left_column.addWidget(self.seo_card)
        self.left_column.addWidget(self.backlink_card)
        self.left_column.addWidget(self.competitor_card)
        self.left_column.addWidget(self.keyword_card)
        
        self.right_column.addWidget(self.performance_card)
        self.right_column.addWidget(self.content_card)
        self.right_column.addWidget(self.audit_card)
        self.right_column.addWidget(self.reports_card)
        
        # Add columns to grid
        self.cards_grid.addLayout(self.left_column)
        self.cards_grid.addLayout(self.right_column)
        
        # Add all components to dashboard layout
        self.dashboard_layout.addWidget(self.dashboard_title)
        self.dashboard_layout.addWidget(self.cards_container)
    
    def create_ai_page(self):
        """Create the AI chat page."""
        self.ai_page = AIChat()
    
    def create_settings_page(self):
        """Create the settings page."""
        self.settings_page = SettingsPage()
    
    def create_help_page(self):
        """Create the help page."""
        self.help_page = HelpPage()
    
    def switch_page(self, page_name):
        """Switch to a specified page by adding/showing its tab."""
        # Deactivate all sidebar buttons
        for button in self.sidebar_buttons.values():
            button.setActive(False)
        
        # Activate the selected button
        self.sidebar_buttons[page_name].setActive(True)
        
        # Check if the tab already exists
        tab_index = -1
        for i in range(self.tab_widget.count()):
            if self.tab_widget.tabText(i) == self.get_page_title(page_name):
                tab_index = i
                break
        
        if tab_index == -1:
            # Tab doesn't exist, add a new one
            if page_name == "home":
                tab_index = self.tab_widget.add_tab(self.dashboard_page, self.get_page_title(page_name), "home")
            elif page_name == "ai":
                tab_index = self.tab_widget.add_tab(self.ai_page, self.get_page_title(page_name), "robot")
            elif page_name == "settings":
                tab_index = self.tab_widget.add_tab(self.settings_page, self.get_page_title(page_name), "settings")
            elif page_name == "help":
                tab_index = self.tab_widget.add_tab(self.help_page, self.get_page_title(page_name), "help")
        
        # Switch to the tab
        self.tab_widget.setCurrentIndex(tab_index)
    
    def open_card_page(self, card_type):
        """Open a new tab for the clicked card."""
        # Create a placeholder content for the card page
        card_page = QWidget()
        layout = QVBoxLayout(card_page)
        
        # Add a title
        title = QLabel(self.get_card_title(card_type))
        title.setObjectName("page_title")
        
        # Add placeholder content
        placeholder = QLabel(f"This is the {self.get_card_title(card_type)} page content.")
        placeholder.setWordWrap(True)
        placeholder.setAlignment(Qt.AlignmentFlag.AlignCenter)
        
        layout.addWidget(title)
        layout.addWidget(placeholder)
        layout.addStretch()
        
        # Get the icon for this card type
        icon_map = {
            "seo_score": "chart-line",
            "backlink_map": "link",
            "competitor_analysis": "target",
            "keyword_research": "search",
            "performance_tracking": "activity",
            "content_analysis": "file-text",
            "site_audit": "tool",
            "reports": "file"
        }
        icon_name = icon_map.get(card_type, "file")
        
        # Add a new tab with this content
        tab_index = self.tab_widget.add_tab(card_page, self.get_card_title(card_type), icon_name)
        self.tab_widget.setCurrentIndex(tab_index)
    
    def handle_tab_change(self, index):
        """Handle tab change to update sidebar button state."""
        if index < 0:
            return
        
        # Get the tab text
        tab_text = self.tab_widget.tabText(index)
        
        # Map tab text to sidebar button
        for button_name, button in self.sidebar_buttons.items():
            if self.get_page_title(button_name) == tab_text:
                # Deactivate all buttons first
                for btn in self.sidebar_buttons.values():
                    btn.setActive(False)
                
                # Activate the matching button
                button.setActive(True)
                break
    
    def get_page_title(self, page_name):
        """Get the localized title for a page."""
        lang = self.loc_manager.current_language
        
        # Map page names to title keys
        title_map = {
            "home": "dashboard.title",
            "ai": "ai.title",
            "settings": "settings.title",
            "help": "help.title"
        }
        
        # Default titles if translation not found
        default_map = {
            "home": "Dashboard",
            "ai": "AI Assistant",
            "settings": "Settings",
            "help": "Help"
        }
        
        title_key = title_map.get(page_name, "")
        default_title = default_map.get(page_name, page_name.capitalize())
        
        return lang.get(title_key, default_title)
    
    def get_card_title(self, card_type):
        """Get the localized title for a card."""
        lang = self.loc_manager.current_language
        
        # Map card types to title keys
        title_key = f"dashboard.cards.{card_type}.title"
        
        # Default titles if translation not found
        default_map = {
            "seo_score": "SEO Score",
            "backlink_map": "Backlink Map",
            "competitor_analysis": "Competitor Analysis",
            "keyword_research": "Keyword Research",
            "performance_tracking": "Performance Tracking",
            "content_analysis": "Content Analysis",
            "site_audit": "Site Audit",
            "reports": "Reports"
        }
        
        default_title = default_map.get(card_type, card_type.replace("_", " ").title())
        
        return lang.get(title_key, default_title)
    
    def update_styling(self, *args):
        """Update main window styling based on current theme."""
        theme = self.theme_manager.current_theme
        
        # Main window styles
        style = f"""
            QMainWindow {{
                background-color: {theme['main']['bg_color']};
            }}
            
            #sidebar {{
                background-color: {theme['sidebar']['bg_color']};
                border-right: 1px solid {theme['sidebar']['border_color']};
            }}
            
            #app_title {{
                color: {theme['sidebar']['title_color']};
                font-size: 22px;
                font-weight: bold;
            }}
            
            #version_label {{
                color: {theme['sidebar']['version_color']};
                font-size: 12px;
            }}
            
            #content_area {{
                background-color: {theme['main']['bg_color']};
            }}
            
            #page_title {{
                color: {theme['main']['title_color']};
                font-size: 24px;
                font-weight: bold;
                margin-bottom: 20px;
            }}
        """
        self.setStyleSheet(style)
    
    def update_translation(self, *args):
        """Update UI text based on current language."""
        lang = self.loc_manager.current_language
        
        # Update window title
        self.setWindowTitle(f"{APP_NAME} {lang.get('window.title', 'Dashboard')}")
        
        # Update sidebar button text
        self.home_button.text = lang.get("sidebar.home", "Dashboard")
        self.home_button.setText(self.home_button.text)
        
        self.ai_button.text = lang.get("sidebar.ai", "AI Assistant")
        self.ai_button.setText(self.ai_button.text)
        
        self.settings_button.text = lang.get("sidebar.settings", "Settings")
        self.settings_button.setText(self.settings_button.text)
        
        self.help_button.text = lang.get("sidebar.help", "Help")
        self.help_button.setText(self.help_button.text)
        
        # Update dashboard title
        self.dashboard_title.setText(lang.get("dashboard.title", "Dashboard"))
        
        # Update tab titles - only if the tabs exist
        for i in range(self.tab_widget.count()):
            tab_text = self.tab_widget.tabText(i)
            for page_name in ["home", "ai", "settings", "help"]:
                if tab_text == self.get_page_title(page_name):
                    self.tab_widget.setTabText(i, self.get_page_title(page_name))
                    break


def main():
    """Main application entry point."""
    app = QApplication(sys.argv)
    
    # Setup font
    app.setStyle("Fusion")
    
    # Create main window
    window = Dashboard()
    window.show()
    
    # Start event loop
    sys.exit(app.exec())


if __name__ == "__main__":
    main()

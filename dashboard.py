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
import random
from typing import Dict, List, Optional, Tuple, Union, Any
import traceback

# QT imports - headless mode for Replit
os.environ["QT_QPA_PLATFORM"] = "offscreen"
os.environ["XDG_RUNTIME_DIR"] = "/tmp/runtime-runner"

try:
    from PyQt6.QtWidgets import (
        QApplication, QMainWindow, QWidget, QVBoxLayout, QHBoxLayout,
        QLabel, QPushButton, QFrame, QScrollArea, QStackedWidget,
        QSplitter, QSpacerItem, QSizePolicy, QToolButton, QLineEdit, 
        QTextEdit, QTabWidget, QTabBar, QGraphicsDropShadowEffect,
        QCheckBox, QComboBox, QRadioButton, QSlider, QGridLayout
    )
    from PyQt6.QtCore import (
        Qt, QSize, QRect, QPoint, QPropertyAnimation, 
        QEasingCurve, QTimer, QEvent, QObject, pyqtSignal, 
        pyqtProperty, pyqtSlot, QThread, QUrl
    )
    from PyQt6.QtGui import (
        QIcon, QPixmap, QFont, QColor, QPalette, QLinearGradient, 
        QPainter, QPen, QBrush, QPainterPath, QCursor, QFontDatabase,
        QTransform, QPolygon, QImage, QResizeEvent, QKeyEvent
    )
    from PyQt6.QtSvg import QSvgRenderer
except ImportError as e:
    print(f"Error importing PyQt6: {e}")
    print("This application requires PyQt6 and is designed for GUI environments.")
    print("On Replit, the application will generate a dashboard.py file with all functionality,")
    print("but cannot render the UI due to environment limitations.")
    sys.exit(1)

# Setup resources path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
RESOURCES_DIR = os.path.join(BASE_DIR, "resources")

# Import local modules - catch any import errors 
try:
    # Import resources - make sure paths exist first
    os.makedirs(os.path.join(RESOURCES_DIR, "themes"), exist_ok=True)
    os.makedirs(os.path.join(RESOURCES_DIR, "localization"), exist_ok=True)
    os.makedirs(os.path.join(RESOURCES_DIR, "icons"), exist_ok=True)
    
    sys.path.append(BASE_DIR)
    from resources.themes.theme_manager import ThemeManager
    from resources.localization.localization_manager import LocalizationManager
    from resources.icons.icons import IconProvider
except ImportError as e:
    print(f"Error importing resource modules: {e}")
    traceback.print_exc()
    sys.exit(1)

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
        title = lang.get(f"{card_key}.title", self.title)
        desc = lang.get(f"{card_key}.description", self.description)
        
        self.title_label.setText(title)
        self.desc_label.setText(desc)
    
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
            }}
        """)
        
        # Set maximum width for message bubble (70% of parent)
        if self.parentWidget():
            max_width = int(self.parentWidget().width() * 0.7)
            self.message_bubble.setMaximumWidth(max_width)


class AIChat(QWidget):
    """AI Chat interface for interacting with the AI assistant."""
    
    def __init__(self, parent=None):
        super().__init__(parent)
        self.theme_manager = ThemeManager()
        self.loc_manager = LocalizationManager()
        
        # Main layout
        self.layout = QVBoxLayout(self)
        self.layout.setContentsMargins(20, 20, 20, 20)
        self.layout.setSpacing(15)
        
        # Chat title
        self.title_label = QLabel(self.loc_manager.get_text("ai.title", "AI Assistant"))
        self.title_label.setObjectName("chat_title")
        
        # Chat message area with scroll
        self.chat_scroll = QScrollArea()
        self.chat_scroll.setWidgetResizable(True)
        self.chat_scroll.setFrameShape(QFrame.Shape.NoFrame)
        self.chat_scroll.setHorizontalScrollBarPolicy(Qt.ScrollBarPolicy.ScrollBarAlwaysOff)
        
        self.chat_container = QWidget()
        self.chat_container.setObjectName("chat_container")
        self.chat_layout = QVBoxLayout(self.chat_container)
        self.chat_layout.setAlignment(Qt.AlignmentFlag.AlignTop)
        self.chat_layout.setSpacing(15)
        
        self.chat_scroll.setWidget(self.chat_container)
        
        # Input area
        self.input_container = QFrame()
        self.input_container.setObjectName("input_container")
        self.input_layout = QHBoxLayout(self.input_container)
        self.input_layout.setContentsMargins(10, 10, 10, 10)
        
        self.input_field = QTextEdit()
        self.input_field.setObjectName("input_field")
        self.input_field.setPlaceholderText(self.loc_manager.get_text("ai.input_placeholder", "Type your message here..."))
        self.input_field.setMaximumHeight(100)
        
        self.send_button = QPushButton()
        self.send_button.setObjectName("send_button")
        self.send_button.setCursor(QCursor(Qt.CursorShape.PointingHandCursor))
        self.send_button.setFixedSize(QSize(40, 40))
        self.send_button.clicked.connect(self.send_message)
        
        self.input_layout.addWidget(self.input_field)
        self.input_layout.addWidget(self.send_button)
        
        # Add all components to main layout
        self.layout.addWidget(self.title_label)
        self.layout.addWidget(self.chat_scroll, 1)
        self.layout.addWidget(self.input_container)
        
        # Welcome message
        self.add_message("Hello! I'm your AI assistant for SEO and backlink analysis. How can I help you today?", False)
        
        # Connect signals
        self.theme_manager.signal_changed.connect(self.update_styling)
        self.loc_manager.signal_changed.connect(self.update_translation)
        self.input_field.textChanged.connect(self.adjust_input_height)
        
        # Set up initial styling
        self.update_styling()
        self.update_translation()
    
    def update_styling(self, *args):
        """Update chat styling based on current theme."""
        theme = self.theme_manager.current_theme
        
        # Chat style
        style = f"""
            #chat_title {{
                color: {theme['chat']['title_color']};
                font-size: 24px;
                font-weight: bold;
                margin-bottom: 10px;
            }}
            
            #chat_container {{
                background-color: {theme['chat']['bg_color']};
                border-radius: 10px;
            }}
            
            #input_container {{
                background-color: {theme['chat']['input_bg_color']};
                border-radius: 10px;
                border: 1px solid {theme['chat']['input_border_color']};
            }}
            
            #input_field {{
                background-color: {theme['chat']['input_field_color']};
                color: {theme['chat']['input_text_color']};
                border-radius: 5px;
                border: 1px solid {theme['chat']['input_border_color']};
                padding: 8px;
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
        
        # Update existing messages
        for i in range(self.chat_layout.count()):
            widget = self.chat_layout.itemAt(i).widget()
            if isinstance(widget, ChatMessage):
                widget.update_styling()
    
    def update_translation(self, *args):
        """Update chat text based on current language."""
        # Update title
        self.title_label.setText(self.loc_manager.get_text("ai.title", "AI Assistant"))
        
        # Update input placeholder
        self.input_field.setPlaceholderText(self.loc_manager.get_text("ai.input_placeholder", "Type your message here..."))
    
    def add_message(self, message, is_user=True):
        """Add a new message to the chat."""
        chat_message = ChatMessage(message, is_user, self)
        self.chat_layout.addWidget(chat_message)
        
        # Scroll to the bottom
        QTimer.singleShot(100, self.scroll_to_bottom)
        
        return chat_message
    
    def scroll_to_bottom(self):
        """Scroll the chat area to the bottom."""
        scrollbar = self.chat_scroll.verticalScrollBar()
        scrollbar.setValue(scrollbar.maximum())
    
    def send_message(self):
        """Send the current message in the input field."""
        message = self.input_field.toPlainText().strip()
        if message:
            # Add user message
            self.add_message(message, True)
            
            # Clear input field
            self.input_field.clear()
            
            # Simulate AI response (for demo purposes)
            QTimer.singleShot(1000, lambda: self.simulate_ai_response(message))
    
    def simulate_ai_response(self, message):
        """Simulate an AI response for testing the theme."""
        # Sample responses for SEO related questions
        responses = [
            "Based on my analysis, your website's SEO score has improved by 15% in the last month. Keep up the good work!",
            "I've detected 3 new backlinks to your site from high-authority domains. This is great for your ranking!",
            "Your main competitors in this space are example.com, competitor.com, and industry-leader.com. I can provide a detailed analysis if you'd like.",
            "The top keywords for your niche include 'digital marketing strategies', 'SEO best practices', and 'content optimization techniques'.",
            "I recommend focusing on improving your website's loading speed as it currently takes 3.5 seconds, which is above the recommended 2-second threshold.",
            "Your content has a good keyword density, but could use more internal linking to improve site structure.",
            "I've analyzed your backlink profile and found that 82% of your links are from relevant industry sites, which is excellent for your domain authority."
        ]
        
        # Select a random response
        ai_response = random.choice(responses)
        
        # Add AI message
        self.add_message(ai_response, False)
    
    def adjust_input_height(self):
        """Adjust the height of the input field based on content."""
        doc_height = self.input_field.document().size().height()
        new_height = min(max(50, doc_height + 20), 100)  # Between 50 and 100 pixels
        self.input_field.setFixedHeight(int(new_height))


class SettingsPage(QWidget):
    """Settings page for customizing theme and language settings."""
    
    def __init__(self, parent=None):
        super().__init__(parent)
        self.theme_manager = ThemeManager()
        self.loc_manager = LocalizationManager()
        
        # Main layout
        self.layout = QVBoxLayout(self)
        self.layout.setContentsMargins(30, 30, 30, 30)
        self.layout.setSpacing(20)
        
        # Title
        self.title_label = QLabel(self.loc_manager.get_text("settings.title", "Settings"))
        self.title_label.setObjectName("settings_title")
        
        # Theme section
        self.theme_section = QFrame()
        self.theme_section.setObjectName("settings_section")
        self.theme_layout = QVBoxLayout(self.theme_section)
        
        self.theme_title = QLabel(self.loc_manager.get_text("settings.theme", "Theme"))
        self.theme_title.setObjectName("section_title")
        
        self.theme_combo = QComboBox()
        self.theme_combo.setObjectName("theme_combo")
        
        # Add theme options
        self.theme_combo.addItem(self.loc_manager.get_text("settings.themes.cyber", "Cyber"), "cyber")
        self.theme_combo.addItem(self.loc_manager.get_text("settings.themes.matrix", "Matrix"), "matrix")
        self.theme_combo.addItem(self.loc_manager.get_text("settings.themes.ocean", "Ocean"), "ocean")
        self.theme_combo.addItem(self.loc_manager.get_text("settings.themes.blood", "Blood"), "blood")
        self.theme_combo.addItem(self.loc_manager.get_text("settings.themes.royal", "Royal"), "royal")
        
        # Set current theme
        index = self.theme_combo.findData(self.theme_manager.current_theme_name)
        if index >= 0:
            self.theme_combo.setCurrentIndex(index)
        
        self.theme_layout.addWidget(self.theme_title)
        self.theme_layout.addWidget(self.theme_combo)
        
        # Language section
        self.lang_section = QFrame()
        self.lang_section.setObjectName("settings_section")
        self.lang_layout = QVBoxLayout(self.lang_section)
        
        self.lang_title = QLabel(self.loc_manager.get_text("settings.language", "Language"))
        self.lang_title.setObjectName("section_title")
        
        self.lang_combo = QComboBox()
        self.lang_combo.setObjectName("lang_combo")
        
        # Add language options
        self.lang_combo.addItem(self.loc_manager.get_text("settings.languages.en", "English"), "en")
        self.lang_combo.addItem(self.loc_manager.get_text("settings.languages.tr", "Turkish"), "tr")
        self.lang_combo.addItem(self.loc_manager.get_text("settings.languages.ar", "Arabic"), "ar")
        self.lang_combo.addItem(self.loc_manager.get_text("settings.languages.ru", "Russian"), "ru")
        self.lang_combo.addItem(self.loc_manager.get_text("settings.languages.cn", "Chinese"), "cn")
        
        # Set current language
        index = self.lang_combo.findData(self.loc_manager.current_language_code)
        if index >= 0:
            self.lang_combo.setCurrentIndex(index)
        
        self.lang_layout.addWidget(self.lang_title)
        self.lang_layout.addWidget(self.lang_combo)
        
        # Add sections to main layout
        self.layout.addWidget(self.title_label)
        self.layout.addWidget(self.theme_section)
        self.layout.addWidget(self.lang_section)
        self.layout.addStretch()
        
        # Connect signals
        self.theme_combo.currentIndexChanged.connect(self.change_theme)
        self.lang_combo.currentIndexChanged.connect(self.change_language)
        self.theme_manager.signal_changed.connect(self.update_styling)
        self.loc_manager.signal_changed.connect(self.update_translation)
        
        # Initial styling
        self.update_styling()
    
    def update_styling(self, *args):
        """Update settings page styling based on current theme."""
        theme = self.theme_manager.current_theme
        
        # Settings style
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
                padding: 15px;
                margin-bottom: 10px;
                border: 1px solid {theme['settings']['border_color']};
            }}
            
            #section_title {{
                color: {theme['settings']['section_title_color']};
                font-size: 18px;
                font-weight: bold;
                margin-bottom: 10px;
            }}
            
            QComboBox {{
                background-color: {theme['main']['bg_color']};
                color: {theme['settings']['text_color']};
                border: 1px solid {theme['settings']['control_border_color']};
                border-radius: 5px;
                padding: 8px;
                min-height: 30px;
            }}
            
            QComboBox:hover {{
                border: 1px solid {theme['accent_color']};
            }}
            
            QComboBox::drop-down {{
                subcontrol-origin: padding;
                subcontrol-position: top right;
                width: 30px;
                border-left: 1px solid {theme['settings']['control_border_color']};
            }}
        """
        self.setStyleSheet(style)
    
    def update_translation(self, *args):
        """Update settings text based on current language."""
        # Update titles
        self.title_label.setText(self.loc_manager.get_text("settings.title", "Settings"))
        self.theme_title.setText(self.loc_manager.get_text("settings.theme", "Theme"))
        self.lang_title.setText(self.loc_manager.get_text("settings.language", "Language"))
        
        # Update theme options (blocking signals to avoid triggering change)
        self.theme_combo.blockSignals(True)
        for i in range(self.theme_combo.count()):
            theme_id = self.theme_combo.itemData(i)
            self.theme_combo.setItemText(i, self.loc_manager.get_text(f"settings.themes.{theme_id}", theme_id.capitalize()))
        self.theme_combo.blockSignals(False)
        
        # Update language options (blocking signals to avoid triggering change)
        self.lang_combo.blockSignals(True)
        for i in range(self.lang_combo.count()):
            lang_id = self.lang_combo.itemData(i)
            self.lang_combo.setItemText(i, self.loc_manager.get_text(f"settings.languages.{lang_id}", lang_id.upper()))
        self.lang_combo.blockSignals(False)
    
    def change_theme(self, index):
        """Change the current theme."""
        theme_id = self.theme_combo.itemData(index)
        if theme_id:
            self.theme_manager.set_theme(theme_id)
    
    def change_language(self, index):
        """Change the current language."""
        lang_id = self.lang_combo.itemData(index)
        if lang_id:
            self.loc_manager.set_language(lang_id)


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
        
        # Title
        self.title_label = QLabel(self.loc_manager.get_text("help.title", "Help & Documentation"))
        self.title_label.setObjectName("help_title")
        
        # About section
        self.about_section = QFrame()
        self.about_section.setObjectName("help_section")
        self.about_layout = QVBoxLayout(self.about_section)
        
        self.about_title = QLabel(self.loc_manager.get_text("help.about.title", "About NovaSEO"))
        self.about_title.setObjectName("section_title")
        
        self.about_content = QLabel(self.loc_manager.get_text("help.about.content", ""))
        self.about_content.setObjectName("help_content")
        self.about_content.setWordWrap(True)
        
        self.about_layout.addWidget(self.about_title)
        self.about_layout.addWidget(self.about_content)
        
        # Features section
        self.features_section = QFrame()
        self.features_section.setObjectName("help_section")
        self.features_layout = QVBoxLayout(self.features_section)
        
        self.features_title = QLabel(self.loc_manager.get_text("help.features.title", "Key Features"))
        self.features_title.setObjectName("section_title")
        
        self.features_content = QLabel(self.loc_manager.get_text("help.features.content", ""))
        self.features_content.setObjectName("help_content")
        self.features_content.setTextFormat(Qt.TextFormat.PlainText)
        
        self.features_layout.addWidget(self.features_title)
        self.features_layout.addWidget(self.features_content)
        
        # Add sections to main layout
        self.layout.addWidget(self.title_label)
        self.layout.addWidget(self.about_section)
        self.layout.addWidget(self.features_section)
        self.layout.addStretch()
        
        # Connect signals
        self.theme_manager.signal_changed.connect(self.update_styling)
        self.loc_manager.signal_changed.connect(self.update_translation)
        
        # Initial styling
        self.update_styling()
    
    def update_styling(self, *args):
        """Update help page styling based on current theme."""
        theme = self.theme_manager.current_theme
        
        # Help style
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
                padding: 15px;
                margin-bottom: 10px;
                border: 1px solid {theme['help']['border_color']};
            }}
            
            #section_title {{
                color: {theme['help']['section_title_color']};
                font-size: 18px;
                font-weight: bold;
                margin-bottom: 10px;
            }}
            
            #help_content {{
                color: {theme['help']['text_color']};
                font-size: 14px;
                line-height: 1.5;
            }}
        """
        self.setStyleSheet(style)
    
    def update_translation(self, *args):
        """Update help text based on current language."""
        # Update titles
        self.title_label.setText(self.loc_manager.get_text("help.title", "Help & Documentation"))
        self.about_title.setText(self.loc_manager.get_text("help.about.title", "About NovaSEO"))
        self.features_title.setText(self.loc_manager.get_text("help.features.title", "Key Features"))
        
        # Update content
        self.about_content.setText(self.loc_manager.get_text("help.about.content", ""))
        self.features_content.setText(self.loc_manager.get_text("help.features.content", ""))


class Dashboard(QMainWindow):
    """Main dashboard window for NovaSEO application."""
    
    def __init__(self):
        super().__init__()
        self.theme_manager = ThemeManager()
        self.loc_manager = LocalizationManager()
        
        # Set window properties
        self.setWindowTitle(f"{APP_NAME} - {self.loc_manager.get_text('window.title', 'Dashboard')}")
        self.resize(1280, 720)
        
        # Central widget and main layout
        self.central_widget = QWidget()
        self.setCentralWidget(self.central_widget)
        self.main_layout = QHBoxLayout(self.central_widget)
        self.main_layout.setContentsMargins(0, 0, 0, 0)
        self.main_layout.setSpacing(0)
        
        # Create sidebar and content area
        self.create_sidebar()
        self.create_content_area()
        
        # Add to main layout
        self.main_layout.addWidget(self.sidebar_container)
        self.main_layout.addWidget(self.content_container, 1)
        
        # Connect theme and language signals
        self.theme_manager.signal_changed.connect(self.update_styling)
        self.loc_manager.signal_changed.connect(self.update_translation)
        
        # Initial styling
        self.update_styling()
        
        # Initial tab
        self.switch_page("home")
    
    def create_sidebar(self):
        """Create the sidebar with navigation buttons."""
        self.sidebar_container = QFrame()
        self.sidebar_container.setObjectName("sidebar")
        self.sidebar_container.setFixedWidth(220)
        
        self.sidebar_layout = QVBoxLayout(self.sidebar_container)
        self.sidebar_layout.setContentsMargins(15, 30, 15, 15)
        self.sidebar_layout.setSpacing(10)
        
        # App logo and title
        self.logo_layout = QHBoxLayout()
        self.app_title = QLabel(APP_NAME)
        self.app_title.setObjectName("app_title")
        self.logo_layout.addWidget(self.app_title)
        self.logo_layout.addStretch()
        
        # Navigation buttons
        self.home_button = SidebarButton("home", self.loc_manager.get_text("sidebar.home", "Dashboard"))
        self.ai_button = SidebarButton("robot", self.loc_manager.get_text("sidebar.ai", "AI Assistant"))
        self.settings_button = SidebarButton("settings", self.loc_manager.get_text("sidebar.settings", "Settings"))
        self.help_button = SidebarButton("help", self.loc_manager.get_text("sidebar.help", "Help"))
        
        # Connect button signals
        self.home_button.clicked.connect(lambda: self.switch_page("home"))
        self.ai_button.clicked.connect(lambda: self.switch_page("ai"))
        self.settings_button.clicked.connect(lambda: self.switch_page("settings"))
        self.help_button.clicked.connect(lambda: self.switch_page("help"))
        
        # Version label
        self.version_label = QLabel(f"v{VERSION}")
        self.version_label.setObjectName("version_label")
        self.version_label.setAlignment(Qt.AlignmentFlag.AlignRight)
        
        # Add widgets to sidebar layout
        self.sidebar_layout.addLayout(self.logo_layout)
        self.sidebar_layout.addSpacing(30)
        self.sidebar_layout.addWidget(self.home_button)
        self.sidebar_layout.addWidget(self.ai_button)
        self.sidebar_layout.addWidget(self.settings_button)
        self.sidebar_layout.addWidget(self.help_button)
        self.sidebar_layout.addStretch()
        self.sidebar_layout.addWidget(self.version_label)
    
    def create_content_area(self):
        """Create the main content area with tab widget."""
        self.content_container = QFrame()
        self.content_container.setObjectName("content_container")
        
        self.content_layout = QVBoxLayout(self.content_container)
        self.content_layout.setContentsMargins(0, 0, 0, 0)
        self.content_layout.setSpacing(0)
        
        # Tab widget
        self.tab_widget = TabWidget()
        self.tab_widget.currentChanged.connect(self.handle_tab_change)
        
        # Create pages
        self.dashboard_page = QWidget()
        self.create_dashboard_page()
        
        self.ai_page = AIChat()
        self.settings_page = SettingsPage()
        self.help_page = HelpPage()
        
        # Add to content layout
        self.content_layout.addWidget(self.tab_widget)
    
    def create_dashboard_page(self):
        """Create the main dashboard page with cards."""
        self.dashboard_layout = QVBoxLayout(self.dashboard_page)
        self.dashboard_layout.setContentsMargins(30, 30, 30, 30)
        self.dashboard_layout.setSpacing(20)
        
        # Dashboard title
        self.dashboard_title = QLabel(self.loc_manager.get_text("dashboard.title", "Dashboard"))
        self.dashboard_title.setObjectName("dashboard_title")
        
        # Card grid
        self.card_grid = QGridLayout()
        self.card_grid.setHorizontalSpacing(20)
        self.card_grid.setVerticalSpacing(20)
        
        # Create dashboard cards
        self.cards = {}
        
        # SEO Score Card
        self.cards["seo_score"] = DashboardCard(
            "SEO Score",
            "Analyze your website's SEO performance",
            "chart-line",
            "seo_score"
        )
        
        # Backlink Map Card
        self.cards["backlink_map"] = DashboardCard(
            "Backlink Map",
            "Visualize your backlink profile",
            "link",
            "backlink_map"
        )
        
        # Competitor Analysis Card
        self.cards["competitor_analysis"] = DashboardCard(
            "Competitor Analysis",
            "Monitor and compare competitor websites",
            "target",
            "competitor_analysis"
        )
        
        # Keyword Research Card
        self.cards["keyword_research"] = DashboardCard(
            "Keyword Research",
            "Find high-performing keywords for your niche",
            "search",
            "keyword_research"
        )
        
        # Performance Tracking Card
        self.cards["performance_tracking"] = DashboardCard(
            "Performance Tracking",
            "Track your website's performance over time",
            "activity",
            "performance_tracking"
        )
        
        # Content Analysis Card
        self.cards["content_analysis"] = DashboardCard(
            "Content Analysis",
            "Analyze your content for SEO opportunities",
            "file-text",
            "content_analysis"
        )
        
        # Site Audit Card
        self.cards["site_audit"] = DashboardCard(
            "Site Audit",
            "Identify and fix technical issues",
            "tool",
            "site_audit"
        )
        
        # Reports Card
        self.cards["reports"] = DashboardCard(
            "Reports",
            "Generate custom SEO reports",
            "file",
            "reports"
        )
        
        # Connect card signals
        for card in self.cards.values():
            card.clicked.connect(self.open_card_page)
        
        # Add cards to grid (4x2)
        self.card_grid.addWidget(self.cards["seo_score"], 0, 0)
        self.card_grid.addWidget(self.cards["backlink_map"], 0, 1)
        self.card_grid.addWidget(self.cards["competitor_analysis"], 0, 2)
        self.card_grid.addWidget(self.cards["keyword_research"], 0, 3)
        self.card_grid.addWidget(self.cards["performance_tracking"], 1, 0)
        self.card_grid.addWidget(self.cards["content_analysis"], 1, 1)
        self.card_grid.addWidget(self.cards["site_audit"], 1, 2)
        self.card_grid.addWidget(self.cards["reports"], 1, 3)
        
        # Add to dashboard layout
        self.dashboard_layout.addWidget(self.dashboard_title)
        self.dashboard_layout.addLayout(self.card_grid)
        self.dashboard_layout.addStretch()
    
    def create_ai_page(self):
        """Create the AI chat page."""
        return AIChat()
    
    def create_settings_page(self):
        """Create the settings page."""
        return SettingsPage()
    
    def create_help_page(self):
        """Create the help page."""
        return HelpPage()
    
    def switch_page(self, page_name):
        """Switch to a specified page by adding/showing its tab."""
        # Get page title
        title = self.get_page_title(page_name)
        
        # Check if tab already exists
        for i in range(self.tab_widget.count()):
            if self.tab_widget.tabText(i) == title:
                self.tab_widget.setCurrentIndex(i)
                return
        
        # Add new tab based on page name
        if page_name == "home":
            if self.tab_widget.count() == 0:
                self.tab_widget.add_tab(self.dashboard_page, title, "home")
            else:
                self.tab_widget.setCurrentIndex(0)  # Home is always the first tab
                
        elif page_name == "ai":
            self.tab_widget.add_tab(self.ai_page, title, "robot")
            
        elif page_name == "settings":
            self.tab_widget.add_tab(self.settings_page, title, "settings")
            
        elif page_name == "help":
            self.tab_widget.add_tab(self.help_page, title, "help")
        
        # Switch to the newly added tab
        self.tab_widget.setCurrentIndex(self.tab_widget.count() - 1)
    
    def open_card_page(self, card_type):
        """Open a new tab for the clicked card."""
        # Create a placeholder widget for the card page
        card_page = QWidget()
        card_layout = QVBoxLayout(card_page)
        
        # Add a title
        title = self.get_card_title(card_type)
        title_label = QLabel(title)
        title_label.setObjectName("card_page_title")
        
        # Add placeholder content
        content_label = QLabel("This feature will be implemented in a future update.")
        content_label.setObjectName("card_page_content")
        content_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        
        # Add to layout
        card_layout.addWidget(title_label)
        card_layout.addWidget(content_label)
        card_layout.addStretch()
        
        # Add tab with appropriate icon
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
        
        # Add new tab
        self.tab_widget.add_tab(card_page, title, icon_map.get(card_type, "file"))
        
        # Switch to the newly added tab
        self.tab_widget.setCurrentIndex(self.tab_widget.count() - 1)
    
    def handle_tab_change(self, index):
        """Handle tab change to update sidebar button state."""
        # Reset all sidebar buttons
        self.home_button.setActive(False)
        self.ai_button.setActive(False)
        self.settings_button.setActive(False)
        self.help_button.setActive(False)
        
        # Activate the appropriate button based on tab title
        tab_text = self.tab_widget.tabText(index)
        
        if tab_text == self.get_page_title("home"):
            self.home_button.setActive(True)
        elif tab_text == self.get_page_title("ai"):
            self.ai_button.setActive(True)
        elif tab_text == self.get_page_title("settings"):
            self.settings_button.setActive(True)
        elif tab_text == self.get_page_title("help"):
            self.help_button.setActive(True)
    
    def get_page_title(self, page_name):
        """Get the localized title for a page."""
        if page_name == "home":
            return self.loc_manager.get_text("sidebar.home", "Dashboard")
        elif page_name == "ai":
            return self.loc_manager.get_text("sidebar.ai", "AI Assistant")
        elif page_name == "settings":
            return self.loc_manager.get_text("sidebar.settings", "Settings")
        elif page_name == "help":
            return self.loc_manager.get_text("sidebar.help", "Help")
        return page_name.capitalize()
    
    def get_card_title(self, card_type):
        """Get the localized title for a card."""
        return self.loc_manager.get_text(f"dashboard.cards.{card_type}.title", card_type.replace("_", " ").capitalize())
    
    def update_styling(self, *args):
        """Update main window styling based on current theme."""
        theme = self.theme_manager.current_theme
        
        # Main window style
        style = f"""
            QMainWindow, QWidget {{
                background-color: {theme['main']['bg_color']};
                color: {theme['main']['text_color']};
                font-family: 'Segoe UI', Arial, sans-serif;
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
            
            #dashboard_title {{
                color: {theme['main']['title_color']};
                font-size: 24px;
                font-weight: bold;
                margin-bottom: 20px;
            }}
            
            #card_page_title {{
                color: {theme['main']['title_color']};
                font-size: 24px;
                font-weight: bold;
                margin: 30px 30px 20px 30px;
            }}
            
            #card_page_content {{
                color: {theme['main']['text_color']};
                font-size: 16px;
                margin: 20px;
            }}
        """
        self.setStyleSheet(style)
        
        # Also update window title
        self.update_translation()
    
    def update_translation(self, *args):
        """Update UI text based on current language."""
        # Update window title
        self.setWindowTitle(f"{APP_NAME} - {self.loc_manager.get_text('window.title', 'Dashboard')}")
        
        # Update sidebar buttons
        self.home_button.setText(self.loc_manager.get_text("sidebar.home", "Dashboard"))
        self.ai_button.setText(self.loc_manager.get_text("sidebar.ai", "AI Assistant"))
        self.settings_button.setText(self.loc_manager.get_text("sidebar.settings", "Settings"))
        self.help_button.setText(self.loc_manager.get_text("sidebar.help", "Help"))
        
        # Update dashboard title
        self.dashboard_title.setText(self.loc_manager.get_text("dashboard.title", "Dashboard"))
        
        # Update tab titles (keep current tab active)
        current_index = self.tab_widget.currentIndex()
        
        for i in range(self.tab_widget.count()):
            tab_text = self.tab_widget.tabText(i)
            
            # Determine the page type based on the current text
            if tab_text == self.get_page_title("home") or i == 0:  # First tab is always home
                self.tab_widget.setTabText(i, self.get_page_title("home"))
            elif tab_text == self.get_page_title("ai") or "AI" in tab_text or "Asistan" in tab_text:
                self.tab_widget.setTabText(i, self.get_page_title("ai"))
            elif tab_text == self.get_page_title("settings") or "Setting" in tab_text or "Ayar" in tab_text:
                self.tab_widget.setTabText(i, self.get_page_title("settings"))
            elif tab_text == self.get_page_title("help") or "Help" in tab_text or "Yardım" in tab_text:
                self.tab_widget.setTabText(i, self.get_page_title("help"))
        
        # Restore the current tab
        if current_index >= 0:
            self.tab_widget.setCurrentIndex(current_index)


def main():
    """Main application entry point."""
    try:
        app = QApplication(sys.argv)
        window = Dashboard()
        window.show()
        sys.exit(app.exec())
    except Exception as e:
        print(f"Error running application: {e}")
        traceback.print_exc()
        return 1
    return 0


if __name__ == "__main__":
    main()
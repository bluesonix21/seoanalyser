#!/bin/bash

# NovaSEO GitHub Upload Script
# Bu script projenizi GitHub'a yüklemenize yardımcı olur

echo "🚀 NovaSEO GitHub Yükleme Scripti"
echo "=================================="
echo ""

# GitHub kullanıcı adını kontrol et
GITHUB_USER=$(git config --get user.name)
if [ -z "$GITHUB_USER" ]; then
    echo "❌ Git kullanıcı adı bulunamadı!"
    echo "Lütfen şu komutu çalıştırın: git config --global user.name 'YOUR_USERNAME'"
    exit 1
fi

echo "✅ GitHub Kullanıcı: $GITHUB_USER"
echo ""

# Repository adını sor
read -p "📝 Repository adı (varsayılan: NovaSEO): " REPO_NAME
REPO_NAME=${REPO_NAME:-NovaSEO}

echo ""
echo "🔗 GitHub Repository URL: https://github.com/$GITHUB_USER/$REPO_NAME"
echo ""

echo "📋 Yapılacaklar:"
echo "1. GitHub.com'a gidin ve giriş yapın"
echo "2. Sağ üstteki '+' butonuna tıklayın ve 'New repository' seçin"
echo "3. Repository name: $REPO_NAME"
echo "4. Description: Advanced SEO Analysis & Web Research Platform with AI Integration"
echo "5. Public seçin"
echo "6. HIÇBIR seçeneği işaretlemeyin (No README, no .gitignore, no license)"
echo "7. 'Create repository' butonuna tıklayın"
echo ""

read -p "📌 Repository'yi oluşturdunuz mu? (y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "🔄 Repository'ye bağlanıyor..."
    
    # Remote ekle
    git remote add origin "https://github.com/$GITHUB_USER/$REPO_NAME.git" 2>/dev/null || {
        echo "⚠️  Remote zaten mevcut, güncelleniyor..."
        git remote set-url origin "https://github.com/$GITHUB_USER/$REPO_NAME.git"
    }
    
    # Branch'i main yap
    git branch -M main
    
    echo "📤 Kod yükleniyor..."
    echo ""
    
    # Push yap
    if git push -u origin main; then
        echo ""
        echo "✅ Başarılı! Projeniz GitHub'a yüklendi!"
        echo ""
        echo "🌐 Repository URL: https://github.com/$GITHUB_USER/$REPO_NAME"
        echo ""
        echo "📝 Sonraki adımlar:"
        echo "   - Repository'ye Star verin ⭐"
        echo "   - Topics ekleyin: seo, react, typescript, nodejs, ai"
        echo "   - About bölümünü doldurun"
        echo "   - Issues ve Discussions'ı aktif edin"
        echo ""
    else
        echo ""
        echo "❌ Yükleme başarısız!"
        echo ""
        echo "🔍 Olası sebepler:"
        echo "   1. Repository oluşturulmamış olabilir"
        echo "   2. Repository adı yanlış olabilir"
        echo "   3. GitHub'a giriş yapmanız gerekebilir"
        echo ""
        echo "💡 Çözüm:"
        echo "   1. GitHub Personal Access Token oluşturun:"
        echo "      https://github.com/settings/tokens/new"
        echo "   2. Token'ı kullanarak push yapın:"
        echo "      git push https://TOKEN@github.com/$GITHUB_USER/$REPO_NAME.git main"
        echo ""
    fi
else
    echo ""
    echo "📌 Lütfen önce GitHub'da repository oluşturun!"
    echo "   Sonra bu scripti tekrar çalıştırın."
    echo ""
fi

echo "📚 Dokümantasyon: README.md"
echo "🔒 Güvenlik: SECURITY_REPORT.md"
echo "🤝 Katkı: CONTRIBUTING.md"
echo ""
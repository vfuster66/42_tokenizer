# Définition des répertoires
BACKEND_DIR=code
FRONTEND_DIR=code/frontend

# Définition des commandes
PNPM=pnpm
HARDHAT_CMD=$(PNPM) exec hardhat run scripts/full-test.ts --network bscTestnet
DEV_CMD=$(PNPM) dev

# Commande pour installer toutes les dépendances
.PHONY: install
install:
	@echo "🚀 Installation des dépendances dans $(BACKEND_DIR)/ et $(FRONTEND_DIR)/ ..."
	@cd $(BACKEND_DIR) && $(PNPM) install
	@cd $(FRONTEND_DIR) && $(PNPM) install
	@echo "✅ Installation terminée !"

# Commande pour démarrer le projet
.PHONY: run
run:
	@echo "🚀 Lancement du serveur de développement..."
	@cd $(FRONTEND_DIR) && $(DEV_CMD) &
	@echo "✅ Serveur en cours d'exécution ! Accédez à l'application sur : http://localhost:3000"

# Commande pour exécuter les tests Hardhat
.PHONY: test
test:
	@echo "🚀 Exécution des tests avec Hardhat..."
	@cd $(BACKEND_DIR) && $(HARDHAT_CMD)
	@echo "✅ Tests terminés !"

# Commande pour nettoyer les fichiers node_modules et pnpm store
.PHONY: clean
clean:
	@echo "🧹 Nettoyage des dépendances..."
	@rm -rf $(BACKEND_DIR)/node_modules $(FRONTEND_DIR)/node_modules
	@rm -rf ~/.pnpm-store
	@echo "✅ Nettoyage terminé !"

# Commande pour tout réinstaller
.PHONY: reinstall
reinstall: clean install

# Aide pour voir les commandes disponibles
.PHONY: help
help:
	@echo "📜 Commandes disponibles :"
	@echo "  make install      → Installe les dépendances"
	@echo "  make run          → Démarre le frontend et affiche l'URL"
	@echo "  make test         → Exécute les tests Hardhat"
	@echo "  make clean        → Supprime les dépendances"
	@echo "  make reinstall    → Nettoie et réinstalle toutes les dépendances"
	@echo "  make help         → Affiche cette aide"

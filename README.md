# psf-vue-app

## Production

1. Copier l'exemple du .env de production:

```bash
cp .env.prod.example .env.prod
```

2. Changer les placeholders par les vraies valeurs

3. Pour intégrer directement les variables d'environnement créées au point 2 , il faut utiliser la commande suivante :

```bash
docker-compose --env-file .env.prod -f docker-compose.prod.yaml up --build
```

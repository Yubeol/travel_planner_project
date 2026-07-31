================================================================================
Jenkins 서버 — 로컬 기동 / GitHub Pipeline
================================================================================

1) Jenkins 기동
  cd jenkins
  docker compose up -d --build
  open http://127.0.0.1:8080

  최초 admin 비밀번호:
  docker compose exec jenkins cat /var/jenkins_home/secrets/initialAdminPassword

2) 추천 플러그인
  - Git / GitHub / Pipeline / Docker Pipeline (선택)
  - 제안 플러그인 설치로도 충분

3) Pipeline Job (GitHub)
  New Item → Pipeline
  Definition: Pipeline script from SCM
  SCM: Git
  Repository URL: (이 프로젝트 GitHub URL)
  Script Path: Jenkinsfile
  Branch: */main  (또는 master)

4) 로컬만 (SCM 없이)
  Pipeline script 에 Jenkinsfile 내용 붙여넣기
  또는 워크스페이스에 리포를 체크아웃하도록 구성

5) 배포 결과
  App UI : http://127.0.0.1:8088
  API    : http://127.0.0.1:8088/api/stats
  Docs   : http://127.0.0.1:8088/docs
  Jenkins: http://127.0.0.1:8080

6) 수동 배포 (Jenkins 없이)
  프로젝트 루트에서:
  docker compose up -d --build

7) 재시드
  SEED_ON_START=1 FORCE_SEED=1 docker compose up -d --build backend

주의
  - Docker Desktop 실행 중이어야 함 (docker.sock)
  - 포트: Jenkins 8080 / App 8088 / Postgres 5435
  - backend/docker-compose.yml 은 개발용 Postgres only (루트 compose 와 중복 기동 주의)

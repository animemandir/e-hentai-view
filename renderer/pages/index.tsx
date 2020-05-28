import React, { useEffect, useState, useCallback, useMemo } from 'react'
// import Link from 'next/link'
import Layout from '../components/Layout'
import { NextPage } from 'next'
import { Page } from 'apis'
import { useRouter } from 'next/router'
import {
  Card,
  Typography,
  Grid,
  Box,
  Container,
  Button,
} from '@material-ui/core'
import { makeStyles, Theme, createStyles } from '@material-ui/core/styles'
import { Pagination } from '@material-ui/lab'
import { Skeleton, Rating } from '@material-ui/lab'
import GalleryCard, { LoadingCard } from 'src/index/GalleryCard'
import SearchBar from '@/index/SearchBar'
import { ErrCode } from 'apis/err'
import message from 'components/message'
const useStyles = makeStyles((theme) =>
  createStyles({
    searchButton: { marginLeft: theme.spacing(1) },
    title: { fontSize: '10pt', height: 36, overflow: 'hidden' },
    card: { width: 250, margin: theme.spacing(0, 'auto') },
  })
)
const IndexPage: NextPage = () => {
  const classes = useStyles()
  const router = useRouter()
  const page = parseInt(router.query.page! as string) || 0
  const f_search = decodeURIComponent((router.query.f_search as string) || '')
  const [search, setSearch] = useState(f_search)
  const [list, setList] = useState<Page.IndexListItemPorps[]>([])
  const [empty, setEmpty] = useState(false)
  const [total, setTotal] = useState(0)
  const [totalPage, setTotalPage] = useState(1)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    const fn = async () => {
      let list: Page.IndexListItemPorps[] = []
      setLoading(true)
      setEmpty(false)
      let res = await Page.IndexList({ page, f_search })
      if (res.code === ErrCode.ERROR) {
        message.error(res.message)
        return router.push('/signin')
      }
      list = res.data.list
      setLoading(false)
      setList(list)
      setTotalPage(res.data.totalPage)
      setTotal(res.data.total)
      console.log(res.data)
      if (list.length === 0) setEmpty(true)
    }
    fn()
  }, [page, f_search, router])

  const handleSubmit = () => {
    if (search.length < 3 && search.length > 0)
      return message.error(
        'The search string is too short, and was ignored.',
        1500
      )
    router.push(`/index?page=0&f_search=${search}`)
  }

  const renderPagination = useMemo(() => {
    const handlePageChange = (
      _event: React.ChangeEvent<unknown>,
      value: number
    ) => {
      router.push(`/index?page=${value - 1}&f_search=${search}`)
    }
    return (
      <Box m={2}>
        <Grid container justify="center">
          <Pagination
            count={totalPage}
            page={page + 1}
            onChange={handlePageChange}
          />
        </Grid>
      </Box>
    )
  }, [page, router, search, totalPage])

  return (
    <Layout title="home">
      <Box p={2}>
        <Container style={{ maxWidth: 1600 }}>
          <Container maxWidth="sm">
            <Grid container alignItems="center">
              <Grid item xs>
                <SearchBar
                  value={search}
                  onChange={(v) => setSearch(v)}
                  onSearch={handleSubmit}
                />
              </Grid>
              <Button className={classes.searchButton} onClick={handleSubmit}>
                Search
              </Button>
            </Grid>
          </Container>
          {empty ? (
            <Box p={2}>
              <Typography variant="subtitle2" align="center">
                no this found
              </Typography>
            </Box>
          ) : (
            <Box p={2}>
              <Typography variant="subtitle2" align="center">
                Showing {total} results
              </Typography>
              {renderPagination}
              <Grid
                container
                wrap="wrap"
                justify="flex-start"
                alignItems="stretch"
                spacing={2}
              >
                {loading
                  ? new Array(25).fill(0).map((_, k) => <LoadingCard key={k} />)
                  : list.map((o) => (
                      <Grid item xs={12} sm={6} md={4} lg key={o.gid}>
                        <GalleryCard record={o} />
                      </Grid>
                    ))}
              </Grid>
              {renderPagination}
            </Box>
          )}
        </Container>
      </Box>
    </Layout>
  )
}

export default IndexPage

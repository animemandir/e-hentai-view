import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { NextPage } from 'next'
import { api, Page } from 'apis'
import {
  Grid,
  Box,
  Card,
  Divider,
  CardContent,
  Typography,
  Chip,
  CardActionArea,
  Container,
  Button,
  Hidden,
} from '@material-ui/core'
import { makeStyles, Theme, createStyles } from '@material-ui/core/styles'
import { Skeleton, Rating, Pagination } from '@material-ui/lab'
import Layout from 'components/Layout'
import throttle from 'lodash/throttle'
import LoadMedia from 'components/LoadMedia'
import ImgRead from '@/detail/ImgRead'
import { useRouter } from 'next/router'
import ColorChip from 'components/ColorChip'
import CommentList from 'src/detail/CommentList'
import clsx from 'clsx'
import InfoCard from '@/detail/InfoCard'
import { useScroll, useThrottleFn } from '@umijs/hooks'
const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      display: 'flex',
    },
    details: {
      display: 'flex',
      flexDirection: 'column',
      flex: '1',
    },
    content: {
      flex: '1 0 auto',
    },
    cover: {
      width: 240,
      maxHeight: 320,
      margin: theme.spacing(0, 'auto'),
      [theme.breakpoints.down('sm')]: {
        width: 150,
        minHeight: 200,
      },
    },
    center: {
      display: 'flex',
      alignItems: 'center',
    },
    divider: { margin: theme.spacing(1, 0) },
    chip: {
      margin: theme.spacing(0, 'auto', 2),
      width: '70%',
      display: 'flex',
    },
    button: {
      color: '#fff',
    },
    border: {
      borderStyle: 'solid',
      borderColor: theme.palette.divider,
      borderWidth: '0 1px',
      flex: 1,
      padding: theme.spacing(0, 1),
      margin: theme.spacing(0, 1),
      [theme.breakpoints.down('sm')]: {
        borderWidth: '1px 0',
        padding: theme.spacing(1, 0),
        margin: theme.spacing(1, 0),
      },
    },
    container: {},
    infoContainer: {
      [theme.breakpoints.down('sm')]: {
        display: 'flex',
        flexDirection: 'column',
      },
    },
  })
)

export type DetailProps = { gid: string; token: string; filecount: string }
const Detail: NextPage<DetailProps> = () => {
  const router = useRouter()
  const ref = useRef<HTMLDivElement>(null)
  const gid = router.query.gid as string
  const token = router.query.token as string
  const filecount = router.query.filecount as string
  const [record, setRecord] = useState<Page.IndexListItemPorps>()
  const [dataSource, setDataSource] = useState<{
    list: Page.DetailPageListItemProps[]
    commentList: Page.commentListItemProps[]
    tagList: Page.tagListItemProps[]
  }>({ list: [], commentList: [], tagList: [] })
  const [store, setStore] = useState({
    open: false,
    index: -1,
  })

  const [page, setPage] = useState(1)
  const [totalPage, setTotalPage] = useState(1)
  const classes = useStyles()
  useEffect(() => {
    if (!gid) return
    api.gdata([[gid, token]]).then((res) => {
      console.log(res)
      setRecord(res.data.gmetadata[0])
    })
    Page.DetailPage(gid, token, filecount).then((res) => {
      console.log(res)
      setDataSource(res)
      setTotalPage(Math.ceil(+filecount / 20))
    })
  }, [gid, token, filecount])

  const handleOpen = (k: number) => {
    setStore({ open: true, index: k })
  }

  const download = () => {
    if (dataSource.list.length > 0) {
      Page.DownloadAllImg(
        { record: record!, tagList: dataSource.tagList },
        dataSource.list
      )
    }
  }

  const [position] = useScroll(() => window.document)
  useThrottleFn(
    () => {
      if (document.scrollingElement) {
        if (
          position.top + document.scrollingElement.clientHeight >
          document.scrollingElement.scrollHeight - 300
        ) {
          setPage((t) => t + 1)
        }
      }
    },
    [position],
    300
  )
  return (
    <Layout title={record?.title}>
      <Container style={{ maxWidth: 1600 }}>
        <Box p={2}>
          <Card className={classes.root}>
            <Hidden smDown>
              {record?.thumb ? (
                <div className={classes.center}>
                  <LoadMedia
                    className={clsx(classes.cover)}
                    src={record.thumb}
                  />
                </div>
              ) : (
                <Skeleton
                  variant="rect"
                  animation="wave"
                  width={240}
                  height={320}
                />
              )}
            </Hidden>
            <CardContent className={classes.details}>
              <Typography
                variant="subtitle1"
                component="h6"
                gutterBottom
                align="center"
              >
                {record?.title_jpn}
              </Typography>
              <Typography
                variant="subtitle2"
                component="h5"
                gutterBottom
                align="center"
              >
                {record?.title}
              </Typography>
              <Divider variant="fullWidth" className={classes.divider} />
              <Box display="flex" className={classes.infoContainer}>
                <InfoCard record={record} />
                <div className={classes.border}>
                  <table>
                    <tbody>
                      {dataSource.tagList.map((o) => (
                        <tr key={o.name}>
                          <td
                            align="right"
                            valign="top"
                            style={{ lineHeight: '24px' }}
                          >
                            {o.name}
                          </td>
                          <td>
                            {o.tags.map((v) => (
                              <Chip
                                key={v.name}
                                label={v.name}
                                size="small"
                                variant="outlined"
                                style={{
                                  borderStyle: v.dash ? 'dashed' : 'solid',
                                  margin: 2,
                                }}
                                clickable
                                onClick={() => {
                                  router.push(
                                    `/index?page=0&f_search=${v.keyword}`
                                  )
                                }}
                              />
                            ))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div>
                  <Button onClick={download} variant="text" color="primary">
                    download
                  </Button>
                </div>
              </Box>
            </CardContent>
          </Card>
          <CommentList commentList={dataSource.commentList} />
          <Divider variant="fullWidth" className={classes.divider} />

          <Grid container className={classes.container} spacing={2} ref={ref}>
            {dataSource.list.slice(0, 20 * page).map((o, k) => (
              <Grid item key={o.url + k}>
                <Card>
                  <CardActionArea onClick={() => handleOpen(k)}>
                    <LoadMedia className={classes.cover} src={o.thumb} />
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
            {dataSource.list.length === 0 &&
              new Array(20).fill(0).map((_, k) => (
                <Grid item key={k}>
                  <Card>
                    <Skeleton
                      variant="rect"
                      animation="wave"
                      className={classes.cover}
                    />
                  </Card>
                </Grid>
              ))}
          </Grid>
        </Box>
        <ImgRead
          dataSource={dataSource.list}
          open={store.open}
          defaultValue={store.index}
          onClose={() => setStore({ open: false, index: -1 })}
        />
      </Container>
    </Layout>
  )
}

export default Detail
